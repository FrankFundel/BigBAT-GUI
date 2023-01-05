#!/usr/bin/env python3

import functools
import torch
import librosa

from tools import preprocess, slideWindow
from models.BigBAT import BigBAT
import torch
import torch.nn as nn
from scipy import signal

# 1th order butterworth high-pass filter with cut-off frequency of 15,000 kHz
b, a = signal.butter(10, 15000 / 120000, 'highpass')

class Model():
  def __init__(self, classes, modelpath):
    self.classes = classes
  
    big_patch_embedding = nn.Sequential(
      nn.Conv2d(1, 16, kernel_size=(3, 5), stride=(2, 3), padding=3),
      nn.BatchNorm2d(16),
      nn.ReLU(),
      #nn.MaxPool2d(kernel_size=3, stride=2, padding=1),

      nn.Conv2d(16, 32, kernel_size=(3, 5), stride=(2, 3), padding=3),
      nn.BatchNorm2d(32),
      nn.ReLU(),
      nn.MaxPool2d(kernel_size=3, stride=2, padding=1),

      nn.Conv2d(32, 32, kernel_size=(3, 3), stride=(2, 3), padding=1),
      nn.BatchNorm2d(32),
      nn.ReLU(),
      #nn.MaxPool2d(kernel_size=5, stride=2, padding=1),

      nn.Conv2d(32, 64, kernel_size=(3, 3), stride=(2, 3), padding=1),
      nn.BatchNorm2d(64),
      nn.ReLU(),

      nn.Conv2d(64, 64, kernel_size=(3, 3), stride=(2, 2), padding=1),
      nn.BatchNorm2d(64),
      nn.ReLU(),
      #nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
    )

    self.model = BigBAT(
      max_len=60,
      patch_len=44,
      patch_skip=22,
      d_model=64,
      num_classes=len(list(classes)),
      patch_embedding=big_patch_embedding,
      nhead=2,
      dim_feedforward=32,
      num_layers=2,
    )
    self.model.load_state_dict(torch.load(modelpath, map_location='cpu'))
    self.model.eval()

  def predict(self, filename, sample_rate=220500, threshold=0.5):
    y, _ = librosa.load(filename, sr=sample_rate)
    y = signal.lfilter(b, a, y)
    ys = slideWindow(y, (60 + 1) * 2816, 60 * 2816)
    x = preprocess(torch.Tensor(ys))
    output = self.model(x)
    prediction = torch.sigmoid(output).mean(axis=0)
    
    def compare(a, b):
      if prediction[a] < prediction[b]:
        return 1
      elif prediction[a] > prediction[b]:
        return -1
      else:
        return 0
    
    if threshold == -1:
      threshold = prediction.mean(axis=0)
    else:
      threshold = threshold

    labels = torch.nonzero(prediction > threshold)[:, 0].tolist()
    labels.sort(key=functools.cmp_to_key(compare))
    return prediction.tolist(), labels
