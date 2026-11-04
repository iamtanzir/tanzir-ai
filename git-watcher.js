const { execSync } = require('child_process');
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
      // Log as warning instead of crashing the server
      // console.log("GitWatcher: Git not found or not a repo. Skipping commit detection.");
      return null;
    }
  }

  start() {
    console.log("GitWatcher: Initializing monitoring...");
    setInterval(() => {
      try {
        const currentHash = this.getLatestCommitHash();
        if (currentHash && currentHash !== this.lastCommitHash) {
          console.log(`GitWatcher: New commit detected! ${currentHash.slice(0, 7)}`);
          this.lastCommitHash = currentHash;
          this.onCommit(currentHash);
        }
      } catch (err) {
        // Silently fail to avoid server crash
      }
    }, this.pollInterval);
  }
}

module.exports = GitWatcher;
