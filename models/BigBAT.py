import torch
import torch.nn as nn
from Transformer import Transformer

class BigBAT(nn.Module):
    
    def __init__(
        self,
        max_len,
        patch_len,
        patch_skip,
        d_model, # must equal to patch_embedding output dim
        num_classes,
        patch_embedding,
        nhead=2,
        dim_feedforward=32,
        num_layers=2,
        dropout=0.1,
        classifier_dropout=0.3
    ):

        super().__init__()

        assert d_model % nhead == 0, "nheads must divide evenly into d_model"
        
        self.patch_len = patch_len
        self.patch_skip = patch_skip
        self.patch_embedding = patch_embedding
    
        self.cls_token = nn.Parameter(torch.randn(1, 1, d_model))
        self.pos_encoder = nn.Parameter(torch.randn(1, max_len + 1, d_model))

        self.dropout = nn.Dropout(classifier_dropout)
        
        self.transformer_encoder = Transformer(
            dim=d_model,
            depth=num_layers,
            heads=nhead,
            dim_head=16,
            mlp_dim=dim_feedforward,
            dropout=dropout)
        
        self.classifier = nn.Sequential(nn.LayerNorm(d_model), nn.Linear(d_model, num_classes))
        
        self.d_model = d_model

    def forward(self, x):
        x = x.unfold(dimension=1, size=self.patch_len, step=self.patch_skip).permute((0, 1, 3, 2)) # patches
    
        b, n, w, h = x.shape
        x = x.reshape((b * n, 1, w, h))
        x = self.patch_embedding(x)
        x = x.reshape((b, n, self.d_model))
        
        #cls = einops.repeat(self.cls_token, '1 n d -> b n d', b=b)
        cls = self.cls_token.repeat((b, 1, 1))
        x = torch.cat((cls, x), dim=1)
        x += self.pos_encoder
        
        x = self.dropout(x)
        x = self.transformer_encoder(x)
        
        #x = x[:, 0]
        x = torch.mean(x[:, 1:], 1)
        x = self.classifier(x)
        return x