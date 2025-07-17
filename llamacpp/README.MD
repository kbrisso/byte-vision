
# Llama.cpp Integration Guide

This directory contains the Llama.cpp binaries and libraries required for local AI model inference in Byte-Vision. Llama.cpp is a C++ implementation of the LLaMA model that provides fast, CPU-optimized inference for large language models.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Key Executables](#key-executables)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Model Formats](#model-formats)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## 🎯 Overview

Llama.cpp enables Byte-Vision to run large language models locally without requiring external API calls, ensuring complete privacy and control over your AI processing. The implementation supports:

- **CPU and GPU inference** (CUDA, Metal, OpenCL)
- **Quantized models** for reduced memory usage
- **Streaming responses** for real-time interactions
- **Embedding generation** for semantic search
- **Multiple model formats** (GGUF, GGML)

## 📦 Installation

### Option 1: Pre-built Binaries (Recommended)

The binaries in this directory are pre-built and ready to use. If you need to update or install fresh binaries:

1. **Download from Official Releases**:
   ```bash
   # Visit https://github.com/ggerganov/llama.cpp/releases
   # Download the appropriate package for your system:
   # - Windows: llama-*-bin-win-x64.zip (CPU) or llama-*-bin-win-cuda-cu*.zip (GPU)
   # - Linux: llama-*-bin-ubuntu-x64.tar.gz
   # - macOS: Use Homebrew or download Darwin package
   ```

2. **Extract to this directory**:
   ```bash
   # Extract all files to the llamacpp/ directory
   # Ensure execute permissions on Unix systems
   chmod +x llamacpp/llama-*
   ```

### Option 2: Build from Source

If you need custom compilation (e.g., for specific hardware optimization):
```
bash
# Clone the repository
git clone [https://github.com/ggerganov/llama.cpp.git](https://github.com/ggerganov/llama.cpp.git) temp-llama cd temp-llama
# Create build directory
mkdir build && cd build
# Configure build (CPU only)
cmake ..
# Configure build with CUDA support
cmake .. -DLLAMA_CUDA=ON
# Configure build with OpenCL support
cmake .. -DLLAMA_OPENCL=ON
# Configure build with Metal support (macOS)
cmake .. -DLLAMA_METAL=ON
# Build
cmake --build . --config Release
# Copy binaries to llamacpp directory
cp bin/* ../../llamacpp/
# Clean up
cd ../.. && rm -rf temp-llama
``` 

## 🔧 Key Executables

### Primary Tools

| Executable | Purpose | Usage in Byte-Vision |
|------------|---------|---------------------|
| `llama-cli.exe` | **Main inference engine** | Chat completions, document Q&A |
| `llama-embedding.exe` | **Embedding generation** | Semantic search, document indexing |
| `llama-server.exe` | **HTTP API server** | Optional web interface |
| `llama-quantize.exe` | **Model quantization** | Reduce model size |

### Utility Tools

| Executable | Purpose |
|------------|---------|
| `llama-tokenize.exe` | Tokenize text and analyze token usage |
| `llama-perplexity.exe` | Calculate model perplexity on text |
| `llama-bench.exe` | Benchmark model performance |
| `llama-imatrix.exe` | Generate importance matrices for quantization |
| `llama-gguf.exe` | Inspect GGUF model files |

### Specialized Tools

| Executable | Purpose |
|------------|---------|
| `llama-batched.exe` | Process multiple prompts in batches |
| `llama-parallel.exe` | Parallel processing examples |
| `llama-speculative.exe` | Speculative decoding for faster inference |
| `llama-lookup.exe` | Lookup table optimization |

## ⚙️ Configuration

### Environment Variables

Byte-Vision uses these environment variables to configure Llama.cpp:
```
env
# Primary executables
LLAMA_CLI_PATH=./llamacpp/llama-cli.exe LLAMA_EMBEDDING_PATH=./llamacpp/llama-embedding.exe
# Model configuration
MODEL_PATH=./models DEFAULT_INFERENCE_MODEL=llama-2-7b-chat.Q4_K_M.gguf DEFAULT_EMBEDDING_MODEL=all-MiniLM-L6-v2.gguf
# Performance settings
LLAMA_THREADS=8 LLAMA_CONTEXT_SIZE=2048 LLAMA_BATCH_SIZE=512
``` 

### Command Line Parameters

Common parameters used by Byte-Vision:
```
bash
# Basic inference
./llama-cli.exe
--model ./models/your-model.gguf
--prompt "Your prompt here"
--ctx-size 2048
--threads 8
# Embedding generation
./llama-embedding.exe
--model ./models/embedding-model.gguf
--prompt "Text to embed"
--embedding
``` 

## 💡 Usage Examples

### 1. Basic Text Generation

```bash
# Simple text completion
./llama-cli.exe \
  --model ../models/llama-2-7b-chat.Q4_K_M.gguf \
  --prompt "Explain quantum computing in simple terms:" \
  --ctx-size 2048 \
  --temp 0.7 \
  --top-p 0.9

# Interactive chat mode
./llama-cli.exe \
  --model ../models/llama-2-7b-chat.Q4_K_M.gguf \
  --interactive \
  --ctx-size 4096 \
  --temp 0.8
```

### 2. Embedding Generation

```bash
# Generate embeddings for semantic search
./llama-embedding.exe \
  --model ../models/all-MiniLM-L6-v2.gguf \
  --prompt "Document content to embed" \
  --embedding \
  --ctx-size 512

# Batch embedding generation
./llama-embedding.exe \
  --model ../models/all-MiniLM-L6-v2.gguf \
  --file input.txt \
  --embedding \
  --output embeddings.txt
```

### 3. Model Analysis

```bash
# Check model information
./llama-gguf.exe ../models/llama-2-7b-chat.Q4_K_M.gguf

# Benchmark model performance
./llama-bench.exe \
  --model ../models/llama-2-7b-chat.Q4_K_M.gguf \
  --threads 8 \
  --ctx-size 2048

# Calculate perplexity
./llama-perplexity.exe \
  --model ../models/llama-2-7b-chat.Q4_K_M.gguf \
  --file test-data.txt
```

## 📁 Model Formats

### GGUF Format (Recommended)

GGUF (GPT-Generated Unified Format) is the current standard:

```bash
# Models should be in GGUF format
your-model.gguf

# Common quantization levels:
# - Q4_K_M: 4-bit quantization, medium quality
# - Q5_K_M: 5-bit quantization, higher quality
# - Q8_0: 8-bit quantization, near-original quality
# - F16: 16-bit floating point, original quality
```

### Model Recommendations

| Use Case | Recommended Quantization | Memory Usage |
|----------|-------------------------|--------------|
| **General Chat** | Q4_K_M | ~4GB |
| **Document Q&A** | Q5_K_M | ~5GB |
| **High Quality** | Q8_0 | ~8GB |
| **Production** | F16 | ~13GB |

## 🚀 Performance Optimization

### CPU Optimization

```bash
# Optimize thread count (usually CPU cores)
--threads 8

# Adjust batch size for memory/speed tradeoff
--batch-size 512

# Use memory mapping for large models
--mmap

# Enable CPU optimizations
--no-mmap  # Disable if you have fast SSD
```

### GPU Acceleration

```bash
# CUDA (NVIDIA)
--gpu-layers 32  # Offload layers to GPU

# Metal (Apple Silicon)
--metal

# OpenCL
--opencl
```

### Memory Management

```bash
# Reduce context size for lower memory usage
--ctx-size 1024

# Use smaller batch sizes
--batch-size 256

# Enable memory optimization
--memory-f16
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **Model Loading Errors**

```bash
# Problem: Model file not found or corrupted
# Solution: Verify model path and integrity
./llama-gguf.exe ../models/your-model.gguf

# Problem: Insufficient memory
# Solution: Use smaller model or reduce context size
./llama-cli.exe --model ../models/smaller-model.gguf --ctx-size 1024
```

#### 2. **Performance Issues**

```bash
# Problem: Slow inference
# Solution: Optimize thread count and batch size
./llama-cli.exe --threads 8 --batch-size 512

# Problem: High memory usage
# Solution: Reduce context size and use quantized model
./llama-cli.exe --ctx-size 1024 --model q4-model.gguf
```

#### 3. **CUDA Issues**

```bash
# Problem: CUDA out of memory
# Solution: Reduce GPU layers or use smaller model
./llama-cli.exe --gpu-layers 16

# Problem: CUDA not detected
# Solution: Check CUDA installation and driver
nvidia-smi
```

### Debug Commands

```bash
# Test basic functionality
./llama-cli.exe --model ../models/test-model.gguf --prompt "Hello" --n-predict 10

# Verbose output for debugging
./llama-cli.exe --model ../models/test-model.gguf --prompt "Hello" --verbose

# Check system capabilities
./llama-bench.exe --help
```

## 🔬 Advanced Usage

### Custom Prompt Templates

```bash
# Use custom prompt format
./llama-cli.exe \
  --model ../models/llama-2-7b-chat.Q4_K_M.gguf \
  --prompt-template "### User: {prompt}\n### Assistant: " \
  --prompt "What is AI?"
```

### Streaming Responses

```bash
# Enable streaming for real-time output
./llama-cli.exe \
  --model ../models/your-model.gguf \
  --prompt "Tell me a story" \
  --stream
```
