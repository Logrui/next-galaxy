const timeline = jest.fn(() => ({
  fromTo: jest.fn().mockReturnThis(),
  to: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  kill: jest.fn(),
  eventCallback: jest.fn(() => undefined),
  progress: jest.fn(() => 0),
  time: jest.fn(() => 0),
  play: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
}));

const gsapObj = { timeline, set: jest.fn(), killTweensOf: jest.fn() };
module.exports = { gsap: gsapObj, default: gsapObj };
