# Collatz tracker

**Live page: https://christophermayes.github.io/collatz_tracker/**

This page draws the Collatz conjecture tree in the browser in real time, continuously adding new paths so the picture never stops changing.
It reproduces the style of the figure by Dmitry Kobak that illustrates the [Collatz conjecture](https://en.wikipedia.org/wiki/Collatz_conjecture) article on Wikipedia.

![Reference figure by Dmitry Kobak (CC0)](https://upload.wikimedia.org/wikipedia/commons/8/8f/Collatz_conjecture_tree_visualization.png)

*Reference figure: [Collatz conjecture tree visualization](https://commons.wikimedia.org/wiki/File:Collatz_conjecture_tree_visualization.png) by Dmitry Kobak, CC0 1.0.*

## The Collatz conjecture

For a positive integer `n`, the Collatz map sends `n` to `n / 2` if `n` is even and to `3n + 1` if `n` is odd.
The conjecture states that repeatedly applying this map eventually reaches 1 from every starting value.
Because the paths from different starting values merge as they descend, their union forms a tree rooted at 1.

## The visualization

The drawing rules follow the reference figure:

- Starting values are random integers below 1,000,000.
- Each path is drawn outward from the root at 1, turning left by 8.65° into an even number and right by 16° into an odd number.
- The length of each edge is `1 / ln(n)`, where `n` is the node of the edge farther from the root.
- The color and thickness of each edge depend linearly on `log1p` of the number of paths that traverse it, using the magma colormap: rarely used edges are thin and light, and the shared trunk is thick and dark.

The page adds 10 random paths per animation frame and keeps the 5,000 most recent.
Once that window is full, each new path replaces the oldest one, so the trunk remains stable while the outer branches change continuously.

## Implementation

The page is written in TypeScript with no framework, built with [Vite](https://vite.dev/), and drawn on an HTML canvas.

Each node's position and heading depend only on its path to 1, so they are computed once and cached.
A new starting value therefore only adds the few segments needed to reach a node already in the tree.
Every frame, the edges are grouped into 48 levels by traversal count and drawn from the lightest level to the darkest.

- [src/collatz.ts](src/collatz.ts) maintains the tree, the cached geometry, and the edge traversal counts.
- [src/main.ts](src/main.ts) handles the animation loop, the colormap, and the drawing. The constants at the top of this file control the window size, the rate of new paths, the range of starting values, and the number of levels.

## Local development

Node.js is provided by a conda environment:

```sh
conda create -n collatz -c conda-forge nodejs
conda activate collatz
npm install
npm run dev      # development server at http://localhost:5173/
npm run build    # type-check and build the static site into dist/
```

Every push to `main` builds the site and deploys it to GitHub Pages through [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Credits

- The reference figure and its drawing rules are by Dmitry Kobak ([Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Collatz_conjecture_tree_visualization.png)), whose original Python notebook is available at [dkobak/collatz-viz](https://github.com/dkobak/collatz-viz). Both are dedicated to the public domain under CC0 1.0.
- Kobak credits as inspiration a [Mathematica Stack Exchange answer](https://mathematica.stackexchange.com/a/85731) and the [Reddit post](https://www.reddit.com/r/math/comments/38cg9r/a_beautiful_picture_related_to_collatz_conjecture/) that prompted it.
- The magma colormap was created by Stéfan van der Walt and Nathaniel Smith for matplotlib. This page interpolates between nine sampled colors from it.

## Acknowledgement

The code, deployment workflow, and this README were written by Claude Opus 5.5, running as GitHub Copilot in Visual Studio Code, at the direction of Christopher Mayes.
The page was tested locally and on the deployed site before publication.
