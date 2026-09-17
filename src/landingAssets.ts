/**
 * Landing photo slots.
 *
 * Final finished-work photos are NOT locked yet. Eray will pick replacements
 * in a follow-up. Until then these paths point at named placeholder files in
 * `public/assets/projects/` — swap by dropping a JPEG/PNG/WebP with the same
 * basename (or a new filename) and updating `src` here.
 *
 * Keep `LANDING_PHOTOS_APPROVED` false until he explicitly selects the shots.
 */
export const LANDING_PHOTOS_APPROVED = false

export const LANDING_PHOTO_DIR = '/assets/projects'

export const LANDING_PHOTOS = {
  kitchen: {
    src: `${LANDING_PHOTO_DIR}/kitchen.svg`,
    alt: 'Kitchen remodel example',
    swapAs: `${LANDING_PHOTO_DIR}/kitchen.jpg`,
  },
  bathroom: {
    src: `${LANDING_PHOTO_DIR}/bathroom.svg`,
    alt: 'Bathroom remodel example',
    swapAs: `${LANDING_PHOTO_DIR}/bathroom.jpg`,
  },
  suite: {
    src: `${LANDING_PHOTO_DIR}/mil-suite.svg`,
    alt: 'Mother-in-law suite example',
    swapAs: `${LANDING_PHOTO_DIR}/mil-suite.jpg`,
  },
  addition: {
    src: `${LANDING_PHOTO_DIR}/home-addition.svg`,
    alt: 'Home addition example',
    swapAs: `${LANDING_PHOTO_DIR}/home-addition.jpg`,
  },
  recentKitchen: {
    src: `${LANDING_PHOTO_DIR}/recent-kitchen.svg`,
    alt: 'Recent kitchen work',
    swapAs: `${LANDING_PHOTO_DIR}/recent-kitchen.jpg`,
  },
  recentBathroom: {
    src: `${LANDING_PHOTO_DIR}/recent-bathroom.svg`,
    alt: 'Recent bathroom work',
    swapAs: `${LANDING_PHOTO_DIR}/recent-bathroom.jpg`,
  },
  recentLiving: {
    src: `${LANDING_PHOTO_DIR}/recent-living-space.svg`,
    alt: 'Recent living space work',
    swapAs: `${LANDING_PHOTO_DIR}/recent-living-space.jpg`,
  },
} as const

export type LandingPhotoKey = keyof typeof LANDING_PHOTOS
