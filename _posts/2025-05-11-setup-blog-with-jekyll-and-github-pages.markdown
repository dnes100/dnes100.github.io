---
layout: post
title:  "Setup blog with jekyll and deploy with github pages"
date:   2025-05-11 23:50:21 +0545
categories: jekyll update
---

Jekyll is a ruby library to build static site generator from markdown. Github pages supports jekyll and can be deployed for free!

# Install jekyll
So first step would be to install ruby through any ruby version managers. Then install jekyll gem:
```
gem install jekyll
```

I had to rehash rbenv for jekyll command to be available: `rbenv rehash`
Confirm if jekyll command is available `jekyll --help`

# Create repository for github pages
Go to github.com and create a special public repository with name in this format: `<username>.github.io`
For me this would be `dnes100.github.io`. This would also be the url for the blog.
Clone this repository to local machine.

# Create jekyll project
Go to the locally cloned project: `cd path/to/dnes100.github.io`\
Create jekyll project: `jekyll new .`\
Start local jekyll server: `bundle exec jekyll serve --livereload`\
Open in browser: `localhost:4000`

# Commit and push changes
```
git config user.email dinesh.hyaunmikha
git config user.name 'Dinesh Hyaunmikha'
git commit -m 'new jekyll project'
git push
```

# Deploy with github action
1. Open Gemfile, uncomment `github-pages` gem and comment `jekyll` gem.
1. run `bundle`, commit and push changes.
1. Go to `Settings` tab of the repository (dnes100.github.io) in github.com
1. Click `Pages` link in left side bar
1. In `Build and deployment` section, select github pages github action. This will open up inline editor for github action yml file.
1. Click save and commit button.
1. Go to `Actions` tab and verify `Deploy Jekyll site to Pages` github action workflow is triggered.
1. Verify site is live at `dnes100.github.io` 🎉

# Start editing website/blog:
1. `_config.yml` file contains global configs like site title, description, name, email, github/twitter usernmae, etc
2. `_posts` folder contains all posts in this format: `YYYY-MM-DD-post-title.markdown`
3. Each commit will trigger github action for deployment.
