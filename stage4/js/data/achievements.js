// The 15 achievements from the plan. Icons are textures already drawn in code.
export const ACHIEVEMENTS = [
  { id: 'first-pop', name: 'First Pop', how: 'Harvest your first crop', icon: 'crop_radish_ripe', scale: 0.45 },
  { id: 'bumper', name: 'Bumper Crop', how: 'A 5-crop swipe', icon: 'coin', scale: 0.9 },
  { id: 'mega', name: 'MEGA BUMPER', how: 'A 10-crop swipe', icon: 'confetti', scale: 1.4 },
  { id: 'sweep', name: 'Field Sweep', how: 'Clear the whole field in one swipe', icon: 'crop_sunflower_ripe', scale: 0.45 },
  { id: 'solid-gold', name: 'Solid Gold', how: 'Make your first golden crop', icon: 'goldglow', scale: 0.28 },
  { id: 'midas', name: 'Midas Farm', how: 'Find all 32 golden crops', icon: 'crop_sunflower_ripe', scale: 0.45 },
  { id: 'macdonald', name: 'Old MacDonald Who?', how: 'Own all 12 animals', icon: 'an_hen', scale: 0.55 },
  { id: 'mortgage', name: 'Mortgage Paid', how: 'Mortgage digs up 100 coins', icon: 'an_pig', scale: 0.55 },
  { id: 'crowbar', name: 'Crow Bar', how: 'Shoo 50 crows', icon: 'crow', scale: 0.7 },
  { id: 'night-owl', name: 'Night Owl', how: 'Collect 100 Moon Dust in one night', icon: 'dust', scale: 1.1 },
  { id: 'moonstruck', name: 'Moon Struck', how: 'Finish Moon Year 1', icon: 'moon_face', scale: 0.22 },
  { id: 'floaty', name: 'Floaty Business', how: 'Harvest 20 floating crops in Year 3', icon: 'crop_cuke_ripe', scale: 0.45 },
  { id: 'moonshot', name: 'Moonshot', how: 'Finish the story', icon: 'moon_hope', scale: 0.22 },
  { id: 'fashion', name: 'Fashion Chick', how: 'Get all 10 hats', icon: 'hat_crown', scale: 0.8 },
  { id: 'zen', name: 'Zen Master', how: 'Play 30 minutes of Zen Mode', icon: 'moon_hum', scale: 0.22 },
];

export const ACH_BY_ID = {};
for (let i = 0; i < ACHIEVEMENTS.length; i++) ACH_BY_ID[ACHIEVEMENTS[i].id] = ACHIEVEMENTS[i];
