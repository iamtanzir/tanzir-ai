const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * GitWatcher monitors the .git folder for changes 
 * and detects new commits in the local repository.
 */
class GitWatcher {
  constructor(repoPath, onCommit) {
    this.repoPath = repoPath;
    this.onCommit = onCommit;
    this.lastCommitHash = this.getLatestCommitHash();
    this.pollInterval = 5000; // Check every 5 seconds
  }

  getLatestCommitHash() {
    try {
      // Executes git rev-parse HEAD to get the current commit hash
      const cmd = `git rev-parse HEAD`;
      const output = execSync(cmd, { cwd: this.repoPath }).toString().trim();
      return output;
    } catch (e) {
      console.log("GitWatcher: Not a git repo or no commits yet.");
      return null;
    }
  }

  start() {
    console.log("GitWatcher: Monitoring for new commits...");
    setInterval(() => {
      const currentHash = this.getLatestCommitHash();
      if (currentHash && currentHash !== this.lastCommitHash) {
        console.log(`GitWatcher: New commit detected! ${currentHash.slice(0, 7)}`);
        this.lastCommitHash = currentHash;
        this.onCommit(currentHash);
      }
    }, this.pollInterval);
  }
}

// Helper to use exec synchronously for simple hash checks
function execSync(cmd, options) {
  const { execSync: nodeExecSync } = require('child_process');
  return nodeExecSync(cmd, options);
}

module.exports = GitWatcher;
