import { ref, push } from 'firebase/database';
import { db } from '../firebaseConfig';

export const notifyUserByUID = async (uid, title, message) => {
  try {
    await push(ref(db, `notifications/${uid}`), {
      title,
      message,
      timestamp: Date.now(),
      read: false,
    });
  } catch (error) {
    console.log('Notification error:', error);
  }
};
