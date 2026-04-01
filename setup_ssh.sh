#!/bin/bash
# SSH setup script for dspacecris-nc1.mandela.ac.za

set -e

SSH_DIR="$HOME/.ssh"
SSH_CONFIG="$SSH_DIR/config"
SSH_KEY="$SSH_DIR/id_rsa"

# Ensure .ssh directory exists with correct permissions
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Append SSH config entry if not already present
if ! grep -q "dspacecris-nc1.mandela.ac.za" "$SSH_CONFIG" 2>/dev/null; then
    cat >> "$SSH_CONFIG" << 'EOF'

Host dspacecris-nc1
    HostName dspacecris-nc1.mandela.ac.za
    User bbido
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
    chmod 600 "$SSH_CONFIG"
    echo "SSH config entry added."
else
    echo "SSH config entry already exists."
fi

# Generate SSH key if it doesn't exist
if [ ! -f "$SSH_KEY" ]; then
    echo "Generating SSH key pair..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY" -N ""
    echo "SSH key generated at $SSH_KEY"
    echo ""
    echo "To enable key-based authentication, copy your public key to the server:"
    echo "  ssh-copy-id -i $SSH_KEY.pub bbido@dspacecris-nc1.mandela.ac.za"
else
    echo "SSH key already exists at $SSH_KEY"
fi

echo ""
echo "Setup complete. Connect with: ssh dspacecris-nc1"
