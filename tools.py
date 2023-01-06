import random
import h5py
from tqdm import tqdm
import numpy as np
from sklearn.utils import shuffle
import torch
import math

def slideWindow(a, size, step):
  corr_size = list(a.shape)
  corr_size[0] = math.ceil(corr_size[0] / size) * size
  c = torch.zeros(corr_size)
  c[:len(a)] = a
  return c.unfold(dimension=0, size=size, step=step)
    
def prepareSet(group, labels, patch_len, patch_skip):
    X = []
    Y = []
    
    sets = group.keys()
    for species in tqdm(list(sets)):
        signal = np.asarray(group.get(species))
        label = np.zeros(len(labels))
        for s in species.split(','):
            if s in labels:
                label[labels[s]] = 1
        if label.sum() > 0:
            patches = slideWindow(signal, patch_len, patch_skip)[:-1] # last one is not full
            X.extend(patches)
            Y.extend([label] * len(patches))
    
    X, Y = shuffle(X, Y, random_state=42)
    return np.asarray(X), np.asarray(Y)

def prepare(file, labels, patch_len, patch_skip):
    prepared_hf = h5py.File(file, 'r')
    X_train, Y_train = prepareSet(prepared_hf.require_group("train"), labels, patch_len, patch_skip)
    X_test, Y_test = prepareSet(prepared_hf.require_group("test"), labels, patch_len, patch_skip)
    X_val, Y_val = prepareSet(prepared_hf.require_group("val"), labels, patch_len, patch_skip)
    return X_train, Y_train, X_test, Y_test, X_val, Y_val

def rand_y(Y, exclude_class):
    for _ in range(len(Y)):
        idx = random.randint(0, len(Y)-1)
        if torch.logical_and(Y[idx], exclude_class).sum() == 0:
            return idx
    return -1

# X and Y need to be shuffled
def mixup(X, Y, min_seq=2, max_seq=2, p_min=1.0, p_max=1.0):
    X2 = X.clone()
    Y2 = Y.clone()
    for i, y in enumerate(Y):
        rand_k = random.randint(min_seq, max_seq)
        for k in range(rand_k-1):
            idx = rand_y(Y, Y2[i])
            if idx != -1:
                p = random.uniform(p_min, p_max)
                X2[i] += p * X[idx]
                Y2[i] += Y[idx]
        X2[i] /= rand_k
    return X2, Y2

def preprocess(x, n_fft=512):
    x = torch.abs(torch.stft(x, n_fft=n_fft, window=torch.hann_window(window_length=n_fft).to(x.device), return_complex=True)) # FFT

    # amplitude to db
    x = 20.0 * torch.log10(torch.clamp(x, min=1e-10))
    x -= 20.0 * torch.log10(torch.clamp(torch.max(x), min=1e-10))
    
    x = torch.abs(x - x.mean(dim=2, keepdim=True).repeat((1, 1, x.shape[2]))) # noise filter
    x /= x.amax(1, keepdim=True).amax(2, keepdim=True) # normalize spectrograms between 0 and 1
    return x.transpose(dim0=2, dim1=1)

def noise(x, std=0.05):
    x += std * torch.randn(x.shape).to(x.device)
    return x

def getCorrects(output, target, threshold=0.5):
    log_and = torch.logical_and(output > threshold, target > threshold)
    corr = 0.0
    for i, t in enumerate(target):
        corr += log_and[i].sum() / max((t > threshold).sum(), (output[i] > threshold).sum())
    return corr