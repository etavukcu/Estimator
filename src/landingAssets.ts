/**
 * Landing photo slots.
 *
 * Finished-work photos stay withheld until Eray approves each shot.
 * Approved so far: primary bathroom (vanity + frameless glass shower + shiplap),
 * to be attached later as `bathroom-finished.jpg`. That file is not in the
 * repo yet, so every slot still uses an abstract SVG placeholder.
 *
 * Do not pull unapproved Drive photos. Do not set `LANDING_PHOTOS_APPROVED`
 * until the chosen files are actually committed.
 */
export const LANDING_PHOTOS_APPROVED = false

export const LANDING_PHOTO_DIR = '/assets/projects'

/**
 * One Eray-approved subject is queued: drop this file into
 * `public/assets/projects/` in a later follow-up, then point `bathroom.src` at it.
 */
export const APPROVED_BATHROOM_PHOTO = `${LANDING_PHOTO_DIR}/bathroom-finished.jpg`

export const LANDING_PHOTOS = {
  kitchen: {
    src: `${LANDING_PHOTO_DIR}/kitchen.svg`,
    alt: 'Kitchen remodel example',
    swapAs: `${LANDING_PHOTO_DIR}/kitchen.jpg`,
  },
  bathroom: {
    src: `${LANDING_PHOTO_DIR}/bathroom.svg`,
    alt: 'Primary bathroom with vanity, frameless glass shower, and shiplap',
    swapAs: APPROVED_BATHROOM_PHOTO,
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
    swapAs: APPROVED_BATHROOM_PHOTO,
  },
  recentLiving: {
    src: `${LANDING_PHOTO_DIR}/recent-living-space.svg`,
    alt: 'Recent living space work',
    swapAs: `${LANDING_PHOTO_DIR}/recent-living-space.jpg`,
  },
} as const

export type LandingPhotoKey = keyof typeof LANDING_PHOTOS
