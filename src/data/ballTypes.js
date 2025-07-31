export const BALL_TYPES = {
  APPLE: {
    score: 1,
    radius: 0.8,
    texture: "../public/textures/apple.jpg",
  },
  ORANGE: {
    score: 2,
    radius: 0.7,
    texture: "../public/textures/orange.png",
  },
  WATERMELON: {
    score: 5,
    radius: 1.2,
    texture: "../public/textures/watermelon.jpg",
  },
  TRASH: {
    score: -5,
    radius: 0.6,
    color: 0x8b4513,
  },
};

export const FRUIT_TYPES_ARRAY = [
  BALL_TYPES.APPLE,
  BALL_TYPES.ORANGE,
  BALL_TYPES.WATERMELON,
];
