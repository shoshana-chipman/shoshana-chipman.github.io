# Shoshana Chipman

Source for my website. Plain HTML, CSS, and a little JavaScript; no build step.

The background is a live Euler–Maruyama simulation, picked at random on each visit: either a noisy particle in a tilted double well, or a noisy theta neuron just past its SNIC bifurcation, lingering at the ghost of the fixed points before each spike. The models are in `js/models.js` and the drawing is in `js/walk.js`.

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

Fonts are Computer Modern Unicode, under the SIL Open Font License (`assets/fonts/LICENSE.txt`).
