const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const generateDisplayId = (): string => {
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }
  return id;
};
