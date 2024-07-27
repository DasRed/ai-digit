docker build -t ai-digit:latest .    
docker run --rm -d -v /mnt/data/ai-digit/config/config.json5:/ai-digit/config.json5 -v /mnt/data/ai-digit/data:/ai-digit/data --name ai-digit ai-digit help
