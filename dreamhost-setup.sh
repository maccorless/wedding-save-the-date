#!/bin/bash

# Dreamhost Node.js Setup Script
# Run this script on your Dreamhost server after SSHing in

echo "=== Dreamhost Node.js Setup for Wedding App ==="
echo ""

# Step 1: Install NVM if not already installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing NVM (Node Version Manager)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Add to .bash_profile
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bash_profile
else
    echo "NVM already installed"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

echo ""

# Step 2: Install Node.js LTS
echo "Installing Node.js LTS..."
nvm install --lts
nvm use --lts

echo ""

# Step 3: Verify installation
echo "Verifying installation..."
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo ""

# Step 4: Create application directory
echo "Creating wedding-app directory..."
mkdir -p ~/wedding-app
cd ~/wedding-app

echo ""

echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Upload your application files to ~/wedding-app/"
echo "2. Create .env file with your settings"
echo "3. Run: npm install --production"
echo "4. Configure Passenger in Dreamhost panel"
echo ""
