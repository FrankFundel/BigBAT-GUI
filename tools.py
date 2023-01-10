import torch
import math

def slideWindow(a, size, step):
  corr_size = list(a.shape)
  corr_size[0] = math.ceil(corr_size[0] / size) * size
  c = torch.zeros(corr_size)
  c[:len(a)] = a
  return c.unfold(dimension=0, size=size, step=step)

def preprocess(x, n_fft=512):
    x = torch.abs(torch.stft(x, n_fft=n_fft, window=torch.hann_window(window_length=n_fft).to(x.device), return_complex=True)) # FFT

    # amplitude to db
    x = 20.0 * torch.log10(torch.clamp(x, min=1e-10))
    x -= 20.0 * torch.log10(torch.clamp(torch.max(x), min=1e-10))
    
    x = torch.abs(x - x.mean(dim=2, keepdim=True).repeat((1, 1, x.shape[2]))) # noise filter
    x /= x.amax(1, keepdim=True).amax(2, keepdim=True) # normalize spectrograms between 0 and 1
    return x.transpose(dim0=2, dim1=1)