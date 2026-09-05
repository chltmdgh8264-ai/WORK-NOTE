import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const DEFAULTS = {
  logs: [],
  reflections: [],
  projects: [],
  certs: [],
  reputations: [],
};

export async function loadAll(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ...DEFAULTS };
    const data = snap.data();
    return { ...DEFAULTS, ...data };
  } catch (e) {
    console.error("loadAll failed", e);
    return { ...DEFAULTS };
  }
}

export async function saveField(uid, field, value) {
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, { [field]: value }, { merge: true });
    return true;
  } catch (e) {
    console.error("saveField failed", e);
    return false;
  }
}
