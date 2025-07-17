# GGUF Models for Byte Vision

This directory contains GGUF format models used by LlamaCpp for text generation. GGUF (GPT-Generated Unified Format) is the current standard format for quantized language models that work with LlamaCpp.

## What are GGUF Models?

GGUF models are optimized, quantized versions of large language models that:
- **Reduce memory usage** through quantization (Q4, Q5, Q8 formats)
- **Maintain performance** while using less resources
- **Support GPU acceleration** for faster inference
- **Work across platforms** (Windows, Linux, macOS)

## Model Sources

### 1. Hugging Face Hub (Primary Source)

The largest collection of GGUF models is available on Hugging Face:

**Search Tips:**
- Search for "GGUF" in model names
- Look for quantized versions (Q4, Q5, Q8)
- Check model cards for performance benchmarks

**Popular Model Collections:**
```
🔗 [https://huggingface.co/models?search=gguf](https://huggingface.co/models?search=gguf) 🔗 [https://huggingface.co/models?search=qwen+gguf](https://huggingface.co/models?search=qwen+gguf) 🔗 [https://huggingface.co/models?search=llama+gguf](https://huggingface.co/models?search=llama+gguf)
``` 

### 2. Unsloth Models

**Unsloth** is a popular creator of optimized GGUF models, known for:
- High-quality quantizations
- Performance-optimized models
- Regular updates with latest model releases
- Excellent documentation

**Notable Unsloth Collections:**
- **Qwen Models**: `unsloth/Qwen2.5-*-bnb-4bit-GGUF`
- **Llama Models**: `unsloth/llama-3-*-bnb-4bit-GGUF`
- **Mistral Models**: `unsloth/mistral-*-instruct-v0.3-bnb-4bit-GGUF`

**Example Unsloth Models:**
```
unsloth/Qwen2.5-7B-Instruct-bnb-4bit-GGUF unsloth/Qwen2.5-14B-Instruct-bnb-4bit-GGUF unsloth/llama-3.1-8b-instruct-bnb-4bit-GGUF
``` 

### 3. Other Prominent GGUF Creators

#### Microsoft (Phi Models)
- **Creator**: `microsoft`
- **Models**: Phi-3-mini, Phi-3-medium, Phi-3.5
- **Strengths**: Excellent small models, good for resource-constrained environments
- **Examples**:
  ```
microsoft/Phi-3-mini-4k-instruct-gguf
microsoft/Phi-3.5-mini-instruct-gguf
  ```

#### Bartowski
- **Creator**: `bartowski`
- **Specialization**: High-quality quantizations of popular models
- **Known for**: Consistent naming, multiple quantization levels
- **Examples**:
  ```
bartowski/Qwen2.5-Coder-7B-Instruct-GGUF
bartowski/Llama-3.1-8B-Instruct-GGUF
  ```

#### MaziyarPanahi
- **Creator**: `MaziyarPanahi`
- **Focus**: Latest model conversions, multiple formats
- **Examples**:
  ```
MaziyarPanahi/Qwen2.5-7B-Instruct-GGUF
MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF
  ```

#### LoneStriker
- **Creator**: `LoneStriker`
- **Specialization**: High-precision quantizations
- **Known for**: Q8_0 and other high-quality formats
- **Examples**:
  ```
LoneStriker/Qwen2.5-7B-Instruct-GGUF
LoneStriker/Meta-Llama-3.1-8B-Instruct-GGUF
  ```

#### QuantFactory
- **Creator**: `QuantFactory`
- **Focus**: Automated quantization service
- **Coverage**: Wide range of models with consistent quality
- **Examples**:
  ```
QuantFactory/Qwen2.5-7B-Instruct-GGUF
QuantFactory/Llama-3.1-8B-Instruct-GGUF
  ```

## Recommended Models by Use Case

### General Purpose (7-8B Parameters)
**Best Balance of Performance and Resources**

1. **Qwen2.5-7B-Instruct** (Recommended)
   - Creator: Multiple (Unsloth, Bartowski, MaziyarPanahi)
   - Size: ~4-8GB depending on quantization
   - Strengths: Excellent reasoning, multilingual, coding

2. **Llama-3.1-8B-Instruct**
   - Creator: Multiple creators available
   - Size: ~4-8GB
   - Strengths: General purpose, well-balanced

3. **Mistral-7B-Instruct**
   - Creator: Multiple creators
   - Size: ~4-7GB
   - Strengths: Fast inference, good instruction following

### Coding Specialists
**Optimized for Programming Tasks**

1. **Qwen2.5-Coder-7B-Instruct**
   - Creator: Bartowski, others
   - Strengths: Code generation, debugging, explanation

2. **DeepSeek-Coder-6.7B-Instruct**
   - Creator: Various GGUF creators
   - Strengths: Multiple programming languages

### Small/Efficient Models (3-4B Parameters)
**For Limited Resources**

1. **Phi-3.5-mini-instruct**
   - Creator: Microsoft, others
   - Size: ~2-4GB
   - Strengths: Very efficient, good performance per size

2. **Qwen2.5-3B-Instruct**
   - Creator: Multiple creators
   - Size: ~2-3GB
   - Strengths: Multilingual, reasonable performance

## Quantization Levels Explained

### Q4_K_M (Recommended for most users)
- **Size**: ~4GB for 7B models
- **Quality**: Good balance of size and quality
- **Use case**: General purpose, limited VRAM

### Q5_K_M
- **Size**: ~5GB for 7B models  
- **Quality**: Better than Q4, slight size increase
- **Use case**: When you have a bit more memory

### Q8_0 (Best Quality)
- **Size**: ~8GB for 7B models
- **Quality**: Highest quality quantization
- **Use case**: When quality is priority over size

### IQ4_XS (Experimental)
- **Size**: Smaller than Q4_K_M
- **Quality**: Experimental, may vary
- **Use case**: Very limited memory situations

## Download Instructions

### Method 1: Direct Download from Hugging Face

```bash
# Install huggingface-hub if not already installed
pip install huggingface-hub

# Download a specific model file
huggingface-cli download unsloth/Qwen2.5-7B-Instruct-bnb-4bit-GGUF \
  --include "*.gguf" \
  --local-dir ./models/

# Or download specific quantization
huggingface-cli download bartowski/Qwen2.5-7B-Instruct-GGUF \
  Qwen2.5-7B-Instruct-Q4_K_M.gguf \
  --local-dir ./models/
```
```
### Method 2: Git LFS (Large Files)
``` bash
# Clone the repository (will download all files)
git lfs clone https://huggingface.co/unsloth/Qwen2.5-7B-Instruct-bnb-4bit-GGUF models/qwen-7b
```
### Method 3: Web Download
1. Visit the model page on Hugging Face
2. Click on "Files and versions"
3. Download the `.gguf` file directly
4. Place in the `models/` directory

## Model Organization
Organize your models for easy management:
``` 
models/
├── qwen/
│   ├── Qwen2.5-7B-Instruct-Q4_K_M.gguf
│   ├── Qwen2.5-7B-Instruct-Q8_0.gguf
│   └── Qwen2.5-Coder-7B-Q4_K_M.gguf
├── llama/
│   ├── Llama-3.1-8B-Instruct-Q4_K_M.gguf
│   └── Llama-3.1-8B-Instruct-Q8_0.gguf
├── phi/
│   └── Phi-3.5-mini-instruct-Q4_K_M.gguf
└── mistral/
    └── Mistral-7B-Instruct-v0.3-Q4_K_M.gguf
```
## Configuration
Update your with the model path: `byte-vision-cfg.env`
``` env
# Example configurations for different models

# Qwen 7B (Recommended)
ModelFullPathVal=/byte-vision-mcp/models/qwen/Qwen2.5-7B-Instruct-Q4_K_M.gguf
GPULayersVal=33
CtxSizeVal=32768

# Phi 3.5 Mini (Low resource)
ModelFullPathVal=/byte-vision-mcp/models/phi/Phi-3.5-mini-instruct-Q4_K_M.gguf
GPULayersVal=28
CtxSizeVal=16384

# Llama 3.1 8B (General purpose)
ModelFullPathVal=/byte-vision-mcp/models/llama/Llama-3.1-8B-Instruct-Q4_K_M.gguf
GPULayersVal=35
CtxSizeVal=32768
```
## Performance Considerations
### GPU Memory Requirements

| Model Size | Q4_K_M | Q5_K_M | Q8_0 | Recommended GPU |
| --- | --- | --- | --- | --- |
| 3B | 2GB | 3GB | 4GB | GTX 1060 6GB+ |
| 7B | 4GB | 5GB | 8GB | RTX 3060 12GB+ |
| 8B | 5GB | 6GB | 9GB | RTX 3070 8GB+ |
| 13B | 8GB | 10GB | 15GB | RTX 4070 12GB+ |
### CPU-Only Performance
- **3-7B models**: Usable on modern CPUs with 16GB+ RAM
- **8-13B models**: Requires 32GB+ RAM for reasonable performance
- **Use lower quantizations** (Q4_K_M) for CPU inference

## Quality Comparison
### By Creator (General Observations)
1. **Unsloth**: Consistently high quality, well-tested
2. **Bartowski**: Reliable, multiple quantization options
3. **Microsoft**: Official models, excellent for Phi series
4. **MaziyarPanahi**: Quick releases, good quality
5. **LoneStriker**: High-precision quantizations

### Recommended Workflow
1. **Start with Q4_K_M** for testing
2. **Upgrade to Q5_K_M or Q8_0** if quality isn't sufficient
3. **Compare creators** for the same base model
4. **Check model cards** for benchmarks and use cases

## Troubleshooting
### Model Won't Load
``` bash
# Check file integrity
ls -la models/your-model.gguf

# Verify it's a valid GGUF file
file models/your-model.gguf
```
### Out of Memory Errors
1. **Use smaller quantization**: Q4_K_M instead of Q8_0
2. **Reduce context size**: Lower in config `CtxSizeVal`
3. **Reduce GPU layers**: Lower `GPULayersVal`
4. **Try smaller model**: 3B instead of 7B

### Poor Performance
1. **Enable GPU acceleration**: Set `GPULayersVal > 0`
2. **Use appropriate quantization**: Q5_K_M or Q8_0 for quality
3. **Check model suitability**: Some models better for specific tasks

## Staying Updated
### Follow Model Creators
- **Unsloth**: Regular releases, good documentation
- **Bartowski**: Consistent quantizations of new models
- **Hugging Face**: Browse trending GGUF models

### Model Evaluation
- Test with your specific use cases
- Compare output quality between quantization levels
- Monitor performance metrics in logs
- Keep backups of well-performing configurations

## Legal and Ethical Considerations
- **Check licenses**: Models have different usage terms
- **Commercial use**: Verify if model allows commercial usage
- **Attribution**: Some models require attribution
- **Responsible use**: Follow model creators' guidelines

Most models use Apache 2.0, MIT, or similar permissive licenses, but always verify before use
