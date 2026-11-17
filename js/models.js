/* Background simulations. Each model steps forward with Euler–Maruyama (dt = .01, five steps
   per drawn sample) and reports a point in a shared plane; walk.js draws the trail. */
(function (root) {
  'use strict';
  const dt = .01, steps = 5;

  function gaussian(seed) {
    let state = seed >>> 0 || 42;
    function uniform() { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return ((state >>> 0) + .5) / 4294967296; }
    return () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
  }

  /* Tilted double well: U(x,y) = x^4/4 - x^2/2 - .12x + .4(y - .35 sin 1.5x)^2, with
     independent noise sqrt(2D) dW on each coordinate, D = .14. The left state is shallower
     than the right one, and noise carries the particle back and forth along a curved valley. */
  const doubleWell = {
    caption: 'noisy double well',
    description: 'A particle diffuses in a tilted double-well potential. Noise occasionally carries it over the barrier between a shallow state on the left and a deeper state on the right.',
    create(seed = 42) {
      const normal = gaussian(seed), D = .14;
      let x = -.934, y = -.345;
      return {
        point: () => [x, y],
        next() {
          for (let n = 0; n < steps; n++) {
            const offset = y - .35 * Math.sin(1.5 * x);
            const driftX = x - x * x * x + .12 + .8 * offset * .525 * Math.cos(1.5 * x);
            const driftY = -.8 * offset;
            x += driftX * dt + Math.sqrt(2 * D * dt) * normal();
            y += driftY * dt + Math.sqrt(2 * D * dt) * normal();
          }
          return [x, y];
        }
      };
    }
  };

  /* Theta neuron with noisy input, just past a saddle-node on an invariant circle (SNIC):
     dθ = [(1 - cos θ) + (1 + cos θ) I] dt + (1 + cos θ) σ dW, with I = .02 and σ = .25.
     The fixed points have collided and vanished, but the phase still slows near θ = 0, where
     they used to be, before each spike at θ = π. For drawing, the radius relaxes to 1 with
     weak independent noise (rate 2, intensity .22), so the invariant circle shows as a noisy ring. */
  const thetaNeuron = {
    caption: 'theta neuron just past its SNIC',
    description: 'The phase of a theta neuron with noisy input, just past a saddle-node-on-invariant-circle bifurcation. The fixed points are gone, but the phase still lingers where they used to be, at the ghost on the right, before sweeping around the circle in a spike.',
    create(seed = 42) {
      const normal = gaussian(seed), I = .02, sigma = .25, k = 2, eta = .22;
      let theta = -.6, r = 1;
      const point = () => [r * Math.cos(theta), r * Math.sin(theta)];
      return {
        point,
        next() {
          for (let n = 0; n < steps; n++) {
            const c = Math.cos(theta);
            theta += ((1 - c) + (1 + c) * I) * dt + (1 + c) * sigma * Math.sqrt(dt) * normal();
            r += -k * (r - 1) * dt + eta * Math.sqrt(dt) * normal();
          }
          return point();
        }
      };
    }
  };

  const models = { doubleWell, thetaNeuron };
  if (typeof module !== 'undefined' && module.exports) module.exports = models;
  else root.BackgroundModels = models;
})(typeof window !== 'undefined' ? window : this);
