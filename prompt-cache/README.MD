# LlamaCpp Prompt Cache

This directory contains prompt cache files used by LlamaCpp to significantly improve model loading and inference performance.

## What is Prompt Caching?

Prompt caching is a performance optimization feature in LlamaCpp that stores the processed state of prompts to disk. Instead of reprocessing the same prompt content every time, LlamaCpp can load the pre-computed state, dramatically reducing startup time and improving response speed.

## How It Works

When LlamaCpp processes a prompt, it goes through several computational steps:
1. **Tokenization**: Converting text to tokens
2. **Context Processing**: Running tokens through the model's attention layers
3. **State Computation**: Calculating internal model states

With prompt caching enabled, LlamaCpp saves the computed state after step 2. On subsequent runs with the same or similar prompts, it can skip the expensive recomputation and load the cached state directly.

## Benefits

- **Faster Startup**: Reduces model loading time from minutes to seconds
- **Improved Response Time**: Eliminates redundant computation for repeated prompt patterns
- **Better User Experience**: Near-instantaneous responses for cached prompts
- **Resource Efficiency**: Reduces CPU/GPU usage for repeated operations

## Configuration

Prompt caching is configured in your `byte-vision-cfg.env` file:

```
# Enable prompt caching
PromptCacheCmd=--prompt-cache
PromptCacheVal=/path/to/prompt-cache/ModelName

# Example for Qwen model
PromptCacheVal=/byte-vision-mcp/prompt-cache/Qwen3-8B-Q8_0
```

## Cache File Naming Convention

Cache files should be named to match your model for easy identification:

```
prompt-cache/
├── Qwen3-8B-Q8_0          # Cache for Qwen3-8B-Q8_0.gguf
├── Llama-3.1-8B-Q4        # Cache for Llama-3.1-8B-Q4.gguf
├── Mistral-7B-Q5          # Cache for Mistral-7B-Q5.gguf
└── ...
```

## Cache Generation

Caches are automatically generated during the first run with a model. The process:

1. **First Run**: LlamaCpp processes the prompt normally and saves the cache
2. **Subsequent Runs**: LlamaCpp loads the cached state for faster processing
3. **Cache Updates**: Caches may be updated if prompt patterns change significantly

## Cache Management

### Automatic Management
- Caches are created automatically when missing
- LlamaCpp handles cache validation and updates
- Old caches are automatically invalidated if incompatible

### Manual Management
```shell script
# Check cache size
du -sh prompt-cache/

# Clear specific model cache
rm -rf prompt-cache/ModelName

# Clear all caches (will regenerate on next use)
rm -rf prompt-cache/*
```


## Performance Impact

### Without Caching
- **Initial Load**: 30-120 seconds (depending on model size)
- **Prompt Processing**: 5-15 seconds for long prompts
- **Total Time**: 35-135 seconds before first token

### With Caching
- **Initial Load**: 5-15 seconds
- **Prompt Processing**: 1-3 seconds (cached portions)
- **Total Time**: 6-18 seconds before first token

**Performance Improvement**: 5-10x faster startup and response times

## Storage Requirements

Cache files can be significant in size:
- **Small Models (3-7B)**: 100MB - 2GB per cache
- **Medium Models (8-13B)**: 500MB - 4GB per cache
- **Large Models (30B+)**: 2GB - 15GB per cache

Ensure you have adequate disk space in the prompt-cache directory.

## Best Practices

### 1. Use Consistent Prompts
- Caching works best with consistent prompt patterns
- System prompts and templates benefit most from caching
- Frequently used prompt prefixes should be cached

### 2. Monitor Cache Size
```shell script
# Monitor cache directory size
watch -n 60 "du -sh prompt-cache/"

# Set up disk space alerts if needed
```


### 3. Cache Naming
- Use descriptive names matching your models
- Include quantization level (Q4, Q5, Q8) in cache names
- Keep naming consistent across your setup

### 4. Backup Important Caches
```shell script
# Backup cache for important models
tar -czf backup/model-cache-$(date +%Y%m%d).tar.gz prompt-cache/ModelName
```


## Troubleshooting

### Cache Not Working
1. **Check Configuration**:
```
# Ensure prompt cache is properly configured
   PromptCacheCmd=--prompt-cache
   PromptCacheVal=/full/path/to/cache/file
```


2. **Verify Permissions**:
```shell script
# Ensure write permissions
   chmod 755 prompt-cache/
```


3. **Check Disk Space**:
```shell script
# Ensure adequate space
   df -h /path/to/prompt-cache/
```


### Cache Corruption
If you suspect cache corruption:
```shell script
# Remove corrupted cache (will regenerate)
rm -rf prompt-cache/ModelName

# Check logs for cache-related errors
tail -f logs/byte-vision-mcp.log | grep cache
```


### Performance Not Improving
- Ensure you're using the same prompt patterns
- Check that cache files are being created
- Verify cache path is correct in configuration
- Monitor logs for cache hit/miss information

## Advanced Configuration

### Cache-Specific Settings
```
# Additional cache-related settings
PromptCacheAllCmd=--prompt-cache-all     # Cache entire context
FlashAttentionCmd=--flash-attn           # Improves cache efficiency
FlashAttentionEnabled=true
```


### Multiple Model Caches
```
# Different caches for different use cases
PromptCacheVal=/prompt-cache/chat-model      # For chat interactions
PromptCacheVal=/prompt-cache/completion-model # For completions
```