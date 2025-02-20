const exec = require("./exec");
const core = require("@actions/core");

function main(inputs) {
  // Set configs from dynamic inputs
  for (const [k, v] of Object.entries(inputs.configs)) {
    exec("git", ["config", `--${inputs.scope}`, k, v]);
  }

  // Configure credentials if github-token input presents
  if (inputs.githubToken) {
    // cf. https://github.com/actions/checkout/blob/main/src/git-auth-helper.ts#L57
    const base64Token = Buffer.from(`x-access-token:${inputs.githubToken}`, "utf8").toString("base64");
    core.setSecret(base64Token);

    // TODO: Enable to replace the hostname for GitHub Enterprise
    const githubHost = "github.com";
    const extraHeaderKey = `http.https://${githubHost}/.extraHeader`;
    const urlInsteadOfKey = `url.https://${githubHost}/.insteadOf`;

    // Remove checkout action's persistent credentials to avoid duplication of Authorization headers.
    // cf. https://github.com/actions/checkout/issues/162
    // Value pattern should be case-insensitive, but the current git version (2.36.1) does not allow the flag "(?i)".
    // So we have to use the exact pattern to match.
    // cf. https://github.com/actions/checkout/blob/main/src/git-auth-helper.ts#L62
    exec("git", ["config", "--local", "--unset-all", extraHeaderKey, "^AUTHORIZATION: basic"]);

    exec("git", ["config", `--${inputs.scope}`, extraHeaderKey, `AUTHORIZATION: basic ${base64Token}`]);
    exec("git", ["config", `--${inputs.scope}`, urlInsteadOfKey, `git@${githubHost}:`]);

    exec(inputs.command)
    
    exec("git", ["config", "--local", "--unset-all", extraHeaderKey, "^AUTHORIZATION: basic"]);
    exec("git", ["config", "--local", "--unset-all", urlInsteadOfKey, `git@${githubHost}:`]);
  }
}

module.exports = main;
