const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitWatcher {
  constructor(repoPath, onCommit) {
    this.repoPath = repoPath;
    this.onCommit = onCommit;
    this.lastCommitHash = null;
    this.pollInterval = 10000; // Check every 10 seconds to be lighter
    this.gitAvailable = this.checkGit();
  }

  checkGit() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  getLatestCommitHash() {
    if (!this.gitAvailable) return null;
    try {
      const output = execSync(`git rev-parse HEAD`, { cwd: this.repoPath }).toString().trim();
      return output;
    } catch (e) {
      return null;
    }
  }

  start() {
    if (!this.gitAvailable) {
      console.log("GitWatcher: Git not found in system path. Commit detection disabled, but server will run normally.");
      return;
    }
    
    this.lastCommitHash = this.getLatestCommitHash();
    console.log("GitWatcher: Monitoring for new commits...");
    
    setInterval(() => {
      try {
        const currentHash = this.getLatestCommitHash();
        if (currentHash && currentHash !== this.lastCommitHash) {
          console.log(`GitWatcher: New commit detected! ${currentHash.slice(0, 7)}`);
          this.lastCommitHash = currentHash;
          this.onCommit(currentHash);
        }
      } catch (err) {
        // Fail silently
      }
    }, this.pollInterval);
  }
}

module.exports = GitWatcher;
