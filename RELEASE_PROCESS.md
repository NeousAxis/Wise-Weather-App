# How to Create a Golden Master Release on GitHub

This document explains the steps to properly version, tag, and release the application on GitHub.

## Prerequisites
- Ensure `gh` CLI is installed and authenticated (`gh auth login`).
- Ensure you are on the `main` branch and it is up to date (`git checkout main && git pull`).

## Steps

1. **Update Version in `package.json`**
   Open `package.json` and increment the `"version"` field (e.g., `"2.1.8" -> "2.1.9"`).

2. **Commit the Change**
   ```bash
   git add package.json .  # Add package.json and any other pending changes
   git commit -m "Bump version to 2.1.9"
   ```

3. **Push the Commit**
   ```bash
   git push origin main
   ```

4. **Create the Release & Tag on GitHub (The Easy Way)**
   Use the GitHub CLI (`gh`) to create the tag AND the release in one go. This ensures the "Latest Release" badge appears immediately.

   ```bash
   gh release create "Golden-master-v2.1.9" --title "Golden Master V2.1.9" --notes "Release Notes Here (e.g. Added Air Quality and Visibility indicators)"
   ```

   *If you don't have `gh` CLI:*
   ```bash
   git tag "Golden-master-v2.1.9"
   git push origin "Golden-master-v2.1.9"
   # Then go to GitHub.com -> Releases -> Draft a new release -> Select the tag you just pushed.
   ```

## Verification
- Go to the GitHub repository homepage.
- You should see **Golden Master V2.1.9** with the green "Latest" label on the right sidebar.
