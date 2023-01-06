import datetime
import platform
import sys
import eel
import json
import time
import os
import csv
import tkinter as tk
from tkinter.filedialog import askopenfilename, askopenfilenames

from tools import preprocess
import soundfile as sf
import torch
from bat import Model
from scipy import signal

# 1th order butterworth high-pass filter with cut-off frequency of 15,000 kHz
b, a = signal.butter(10, 15000 / 120000, 'highpass')

root = tk.Tk()
root.withdraw()
root.wm_attributes('-topmost', 1)

classifiers = [
  {
    "name": "German Bats",
    "path": "models/BigBAT.pth",
    "classes": [
      "Rhinolophus ferrumequinum",
      "Rhinolophus hipposideros",
      "Myotis daubentonii",
      "Myotis brandtii",
      "Myotis mystacinus",
      "Myotis emarginatus",
      "Myotis nattereri",
      "Myotis myotis",
      "Myotis dasycneme",
      "Nyctalus noctula",
      "Nyctalus leisleri",
      "Pipistrellus pipistrellus",
      "Pipistrellus nathusii",
      "Pipistrellus kuhlii",
      "Eptesicus serotinus",
      "Eptesicus nilssonii",
      "Miniopterus schreibersii",
      "Vespertilio murinus",
    ],
    "classes_short": [
      "Rfer",
      "Rhip",
      "Mdaub",
      "Mbrandt",
      "Mmys",
      "Mem",
      "Mnat",
      "Mmyo",
      "Mdas",
      "Nnoc",
      "Nleis",
      "Ppip",
      "Pnat",
      "Pkuhl",
      "Eser",
      "Enil",
      "Mschreib",
      "Vmur",
    ],
  },
]

projects = []
model = None
classifier = None

def save_projects():
  global projects
  with open('projects.json', 'w') as f:
    json.dump(projects, f)

def load_projects():
  global projects
  if os.path.isfile('projects.json'):
    with open('projects.json', 'r') as f:
      projects = json.load(f)
  else:
    projects = []

@eel.expose
def get_projects():
  load_projects()
  return projects

@eel.expose
def add_project(title, description):
  projects.append({
    "title": title,
    "description": description,
    "creation_date": time.time(),
    "recordings": [],
    "classifier": 0
  })
  save_projects()

@eel.expose
def save_project(index, title, description):
  projects[index]["title"] = title
  projects[index]["description"] = description
  save_projects()

@eel.expose
def remove_project(index):
  del projects[index]
  save_projects()

@eel.expose
def remove_recordings(projectIndex, indices):
  for index in sorted(indices, reverse=True):
    del projects[projectIndex]["recordings"][index]
  save_projects()

@eel.expose
def add_recordings(projectIndex):
  filenames = askopenfilenames(filetypes=[("WAV-File", "*.wav")])
  for path in filenames:
    projects[projectIndex]["recordings"].append({
      "title": os.path.basename(path),
      "path": path,
      "date": os.path.getctime(path) * 1000,
      "location": {
        "latitude": 0,
        "longitude": 0,
      },
      "size": os.path.getsize(path),
    })
  save_projects() # Race condition?

@eel.expose
def add_metadata(projectIndex):
  filename = askopenfilename(filetypes=[("CSV-File", "*.csv")])
  if filename == '':
    return
  
  metadata = {}
  with open(filename) as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    next(reader)
    for row in reader:
      title = row[2]
      species = row[24]
      time = row[5] # hh:mm:ss
      date = row[4] # yyyy-mm-dd
      temp = float(row[12])
      loc = [float(row[10]), float(row[11])]
      timestamp = datetime.datetime.strptime(date + ' ' + time, '%Y-%m-%d %H:%M:%S').timestamp() * 1000
      metadata[title] = {
        "species": species, "timestamp": timestamp, "temp": temp, "loc": loc
      }
  recs = projects[projectIndex]["recordings"]
  for r in range(len(recs)):
    if recs[r]["title"] in metadata:
      recdat = metadata[recs[r]["title"]]
      recs[r]["temperature"] = recdat["temp"]
      recs[r]["date"] = recdat["timestamp"]
      recs[r]["location"]["latitude"] = recdat["loc"][0]
      recs[r]["location"]["longitude"] = recdat["loc"][1]
  save_projects()

def get_spectrogram_async(rec):
  y, sr = sf.read(rec["path"], dtype='int16')

  info = sf.info(rec["path"])
  rec["samplerate"] = sr
  rec["duration"] = info.duration
  eel.setRecording(rec)

  x = preprocess(torch.Tensor(y).unsqueeze(0)).squeeze(0) * 255 # save data
  S = x.to(torch.uint8).tolist()
  print("Calculated spectrogram")

  save_projects()
  eel.setSpectrogram(S)

@eel.expose
def get_spectrogram(projectIndex, recordingIndex):
  rec = projects[projectIndex]["recordings"][recordingIndex]
  if not os.path.exists(rec["path"]):
    return False
  eel.spawn(get_spectrogram_async, rec)
  return True

@eel.expose
def set_classifier(projectIndex, classifierIndex):
  projects[projectIndex]["classifier"] = classifierIndex
  save_projects()

def setup_classifier(projectIndex):
  global classifier, model
  c = projects[projectIndex]["classifier"]
  classifier = classifiers[c]
  model = Model(classifier["classes"], classifier["path"])
  print("Done setting up", classifier["name"])

def predict(rec):
  prediction, labels = model.predict(rec["path"])
  classification = {"prediction": prediction, "labels": labels}
  rec["classification"] = classification
  classes = []
  for l in labels:
    classes.append(classifier["classes_short"][l])
  rec["class"] = ", ".join(classes)
  return classification, classes

def classify_async(projectIndex, recordingIndex):
  setup_classifier(projectIndex)
  rec = projects[projectIndex]["recordings"][recordingIndex]
  eel.setRecordingLoading(projectIndex, recordingIndex)
  classification, classes = predict(rec)
  eel.classifiedRecording(projectIndex, recordingIndex, classification, classes, 100)
  save_projects()

@eel.expose
def classify(projectIndex, recordingIndex):
  eel.spawn(classify_async, projectIndex, recordingIndex)

def classify_all_async(projectIndex, indices=None):
  setup_classifier(projectIndex)
  recs = projects[projectIndex]["recordings"]
  if indices is None:
    indices = range(len(recs))

  for p, i in enumerate(indices):
    eel.setRecordingLoading(projectIndex, i)
    if os.path.exists(recs[i]["path"]):
      classification, classes = predict(recs[i])
      save_projects()
    else:
      classification, classes = None, ""
    eel.classifiedRecording(projectIndex, i, classification, classes, (p / len(indices)) * 100)

@eel.expose
def classify_all(projectIndex, indices=None):
  eel.spawn(classify_all_async, projectIndex, indices)

def start_eel(develop):
    """Start Eel with either production or development configuration."""

    if develop:
        directory = 'src'
        app = None
        page = {'port': 3000}
    else:
        directory = 'build'
        app = 'chrome'
        page = 'index.html'

    eel.init(directory, ['.tsx', '.ts', '.jsx', '.js', '.html'])

    eel_kwargs = dict(
        host='localhost',
        port=8080,
        size=(1280, 800),
        block=False,
    )
    try:
        eel.start(page, mode=app, **eel_kwargs)
    except EnvironmentError:
        if sys.platform in ['win32', 'win64'] and int(platform.release()) >= 10:
            eel.start(page, mode='edge', **eel_kwargs)
        else:
            raise
try:
  if __name__ == '__main__':
    import sys
    start_eel(develop=len(sys.argv) == 2)
  while True:
    eel.sleep(1.0)
except (SystemExit, MemoryError, KeyboardInterrupt) as e:
  print("Error", e)