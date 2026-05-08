import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import 'firebase/compat/storage';
import { firebaseConfig } from './firebaseConfig';
import { Player, Play, FormationCollection, StoredGameState, CustomFormations, NavBarPosition, WeekData, SerializablePlay, PlayerStatus } from './types';
import { GAME_DATA, BLANK_WEEK_DATA, DEFAULT_PLAYER_IMAGE, WEEKS } from './constants';
import { DEFAULT_OFFENSE_FORMATIONS, DEFAULT_DEFENSE_FORMATIONS, DEFAULT_SPECIAL_TEAMS_FORMATIONS } from './defaultFormations';
import { removeUndefinedValues } from './utils';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
const dbInstance = firebase.firestore();
export const functions = firebase.functions();
export const storage = firebase.storage();

// WORKAROUND: Force long-polling and disable fetch streams to create the most
// compatible connection for restrictive network environments that might block
// WebSockets or streaming RPCs, leading to timeouts.
try {
    dbInstance.settings({
        experimentalForceLongPolling: true,
    });
} catch (e) {
    console.warn("Could not set Firestore settings. This may be due to another tab being open or persistence being enabled.", e);
}


// NOTE: Offline persistence across sessions has been disabled.
// This is a trade-off to ensure the custom network settings above
// are always applied, which resolves connection timeouts in restrictive network environments.
// The app will still work offline within a single session via Firestore's memory cache.
/*
dbInstance.enablePersistence()
  .catch((err: any) => {
      if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn('Firestore persistence failed: another tab may be open.');
      } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence is not supported in this browser.');
      }
  });
*/

export const db = dbInstance;
export const firestore = firebase.firestore;

// Firestore collections getter to prevent race conditions on initialization
const usersCollection = () => db.collection('users');
const weekCollection = (userId: string) => usersCollection().doc(userId).collection('weeks');


export const onAuthStateChanged = (callback: (user: any) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const signIn = (email: string, password: string) => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const signUp = (email: string, password: string) => {
    return auth.createUserWithEmailAndPassword(email, password);
};

export const signOut = () => {
    return auth.signOut();
};

export const setUserRoleInDb = (userId: string, role: 'coach' | 'viewer' | 'admin', email: string) => {
    const userDocRef = usersCollection().doc(userId);
    // Initialize the user doc with their role and email
    return userDocRef.set({ role, email, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
};


export const checkUserExists = async (userId: string): Promise<boolean> => {
    const doc = await usersCollection().doc(userId).get();
    // A user "exists" for the app if they have completed the first onboarding step,
    // which is setting their team name. This is more reliable than just doc.exists.
    return doc.exists && !!doc.data()?.teamName;
};

const createTombstoneObject = (defaultCollection: FormationCollection) => {
    const tombstoneCollection: { [key: string]: null } = {};
    for (const key in defaultCollection) {
        if (Object.prototype.hasOwnProperty.call(defaultCollection, key)) {
            tombstoneCollection[key] = null;
        }
    }
    return tombstoneCollection;
};


export const initializeNewUser = (userId: string, teamName: string, coachName: string, email: string, ageGroup: string) => {
    const userDocRef = usersCollection().doc(userId);
    const batch = db.batch();

    const defaultWeeks: string[] = [];
    const defaultSchedule = {
        weeks: defaultWeeks,
        opponents: {},
        homeAway: {},
        dates: {},
        results: {},
    };

    const initialUserData = { 
        email,
        teamName, 
        coachName,
        ageGroup,
        teamCity: '',
        schedule: defaultSchedule,
        formations: {
            offense: {},
            defense: {},
            specialTeams: {},
        },
        // This merges with the role set in the previous step
    };

    batch.set(userDocRef, removeUndefinedValues(initialUserData), { merge: true });

    // Create a blank document for each week in the new schedule
    defaultWeeks.forEach(weekId => {
        const weekDocRef = userDocRef.collection('weeks').doc(weekId);
        batch.set(weekDocRef, BLANK_WEEK_DATA);
    });
    
    return batch.commit();
};

export const markWalkthroughCompleted = (userId: string) => {
    return usersCollection().doc(userId).set({ walkthroughCompleted: true }, { merge: true });
};

export const isSetupComplete = async (userId: string): Promise<boolean> => {
    const doc = await usersCollection().doc(userId).get();
    return doc.exists && !!doc.data()?.setupCompleted;
};

export const saveInitialRoster = (userId: string, seasonWeeks: string[], players: { jerseyNumber: number; name: string; position: string; }[]) => {
    const batch = db.batch();
    const userDocRef = usersCollection().doc(userId);

    const playersWithIds: Player[] = players.map((p, index) => ({
        ...p,
        id: (index + 1).toString(),
        offensePlayCount: 0,
        defensePlayCount: 0,
        specialTeamsPlayCount: 0,
        status: PlayerStatus.Playing,
        timeOnField: 0,
        imageUrl: DEFAULT_PLAYER_IMAGE,
    }));

    const cleanPlayers = removeUndefinedValues(playersWithIds);

    seasonWeeks.forEach(weekId => {
        const weekDocRef = usersCollection().doc(userId).collection('weeks').doc(weekId);
        batch.update(weekDocRef, { players: cleanPlayers });
    });

    // Mark the roster setup step as completed for this user.
    batch.set(userDocRef, { rosterSetupPassed: true }, { merge: true });

    return batch.commit();
};

export const addPlayerToAllWeeks = (userId: string, seasonWeeks: string[], newPlayer: Player) => {
    const cleanPlayer = removeUndefinedValues(newPlayer);
    const batch = db.batch();
    seasonWeeks.forEach(weekId => {
        const weekDocRef = usersCollection().doc(userId).collection('weeks').doc(weekId);
        batch.update(weekDocRef, {
            players: firebase.firestore.FieldValue.arrayUnion(cleanPlayer)
        });
    });
    return batch.commit();
};

export const updatePlayerInAllWeeks = async (userId: string, seasonWeeks: string[], playerId: string, updates: Partial<Player>) => {
    const batch = db.batch();
    for (const weekId of seasonWeeks) {
        const weekDocRef = usersCollection().doc(userId).collection('weeks').doc(weekId);
        const doc = await weekDocRef.get();
        if (doc.exists) {
            const players = doc.data().players as Player[];
            const updatedPlayers = players.map(p => {
                if (p.id === playerId) {
                    return Object.assign({}, p, updates);
                }
                return p;
            });
            batch.update(weekDocRef, { players: updatedPlayers });
        }
    }
    return batch.commit();
};

export const updateRosterForAllWeeks = (userId: string, seasonWeeks: string[], newPlayerList: Player[]) => {
    const cleanPlayerList = removeUndefinedValues(newPlayerList);
    const batch = db.batch();
    seasonWeeks.forEach(weekId => {
        const weekDocRef = usersCollection().doc(userId).collection('weeks').doc(weekId);
        // This will overwrite the entire players array for each week.
        batch.update(weekDocRef, { players: cleanPlayerList });
    });
    return batch.commit();
}

export const deletePlayerFromAllWeeks = async (userId: string, seasonWeeks: string[], playerId: string) => {
    const batch = db.batch();
    for (const weekId of seasonWeeks) {
        const weekDocRef = usersCollection().doc(userId).collection('weeks').doc(weekId);
        const doc = await weekDocRef.get();
        if (doc.exists) {
            const data = doc.data();
            
            // 1. Update players array
            const players = (data.players as Player[] || []).filter(p => p.id !== playerId);
            
            // 2. Update depth chart
            const depthChart = data.depthChart as Record<string, string[]> | undefined;
            const updatedDepthChart: Record<string, string[]> = {};
            if (depthChart) {
                for (const group in depthChart) {
                    updatedDepthChart[group] = depthChart[group].filter(id => id !== playerId);
                }
            }

            // 3. Update current lineups
            const currentLineups = data.currentLineups as Record<string, (string | null)[]> | undefined;
            const updatedCurrentLineups: Record<string, (string | null)[]> = {};
            if (currentLineups) {
                for (const formationName in currentLineups) {
                    updatedCurrentLineups[formationName] = currentLineups[formationName].map(id => id === playerId ? null : id);
                }
            }

            const updates = {
                players,
                depthChart: updatedDepthChart,
                currentLineups: updatedCurrentLineups,
            };
            
            batch.update(weekDocRef, updates);
        }
    }
    return batch.commit();
};


export const getUserSchedule = async (userId: string) => {
    const doc = await usersCollection().doc(userId).get();
    if (doc.exists) {
        return doc.data().schedule;
    }
    return null;
};

export const saveSchedule = (userId: string, schedule: any) => {
    const userDocRef = usersCollection().doc(userId);
    return userDocRef.set({ schedule }, { merge: true });
};


// Real-time listener for game state with subcollection support
export const listenToGameState = (
    userId: string,
    weekId: string,
    callback: (result: { data: StoredGameState | WeekData | null, error?: any }) => void
) => {
    const weekDocRef = weekCollection(userId).doc(weekId);
    const unsubscribers: { [key: string]: () => void } = {};

    unsubscribers.week = weekDocRef.onSnapshot((weekDoc: any) => {
        // If a listener for plays already exists, unsubscribe from it before creating a new one.
        if (unsubscribers.plays) {
            unsubscribers.plays();
        }

        if (weekDoc.exists) {
            const weekData = weekDoc.data();

            // One-time migration for oversized documents
            if (weekData.playHistory && Array.isArray(weekData.playHistory) && weekData.playHistory.length > 0) {
                console.warn(`Migrating ${weekData.playHistory.length} plays for week ${weekId} to subcollection...`);
                const playsToMigrate = weekData.playHistory;
                const batch = db.batch();
                playsToMigrate.forEach((play: any) => {
                    // Ensure play is valid and has a timestamp to use as ID
                    if (play && play.timestamp) {
                        const playDocRef = weekDocRef.collection('plays').doc(play.timestamp.toString());
                        batch.set(playDocRef, play);
                    }
                });
                // After setting up all the play writes, update the main doc to remove the old array.
                batch.update(weekDocRef, { playHistory: firebase.firestore.FieldValue.delete() });
                batch.commit().then(() => {
                    console.log("Migration successful!");
                    // The listeners will automatically pick up the new structure, no need to manually call callback here.
                }).catch(err => {
                    console.error("Migration failed:", err);
                    // If migration fails, we might be stuck. The app should still try to function.
                    // The listener will continue, but saves will likely fail.
                });
                // Don't return early. Let the new listener structure take over.
            }

            // Set up the listener for the 'plays' subcollection
            unsubscribers.plays = weekDocRef.collection('plays').orderBy('timestamp', 'asc').onSnapshot((playsSnapshot: any) => {
                const playHistory = playsSnapshot.docs.map((doc: any) => doc.data() as SerializablePlay);
                // Combine week metadata with the plays from the subcollection
                const fullGameState = { ...weekData, playHistory };
                callback({ data: fullGameState as StoredGameState });
            }, (playsError: any) => {
                console.error("Error listening to plays subcollection:", playsError);
                // If plays fail to load, return metadata with empty plays array
                callback({ data: { ...weekData, playHistory: [] }, error: playsError });
            });
        } else {
            // Document doesn't exist (e.g., new week)
             callback({ data: BLANK_WEEK_DATA });
        }
    }, (weekError: any) => {
        if (weekError.code === 'not-found') {
            // This is a special case. If the WEEK document itself doesn't exist, we can't create listeners on its subcollections.
            // The user may have deleted the event. We should signal this clearly.
            callback({ data: null, error: weekError });
        } else {
            console.error("Error listening to game state:", weekError);
            callback({ data: BLANK_WEEK_DATA, error: weekError });
        }
    });

    // Return a function that unsubscribes from all active listeners
    return () => Object.values(unsubscribers).forEach(unsub => unsub());
};

// Save game state metadata (excluding plays)
export const saveGameStateToFirebase = (userId: string, weekId: string, gameState: any) => {
    // CRITICAL: Exclude playHistory from the object being saved.
    const { playHistory, ...metadata } = gameState;
    const cleanState = removeUndefinedValues(metadata);
    return weekCollection(userId).doc(weekId).set(cleanState, { merge: true });
};

// Functions to manage individual plays in the subcollection
export const savePlay = (userId: string, weekId: string, play: Play) => {
    const playDocId = play.timestamp.toString();
    // Convert Set to Array for Firestore
    const serializablePlay = {
        ...play,
        playerIds: Array.from(play.playerIds),
    };
    const cleanPlay = removeUndefinedValues(serializablePlay);
    return weekCollection(userId).doc(weekId).collection('plays').doc(playDocId).set(cleanPlay);
};

export const deletePlay = (userId: string, weekId: string, play: Play) => {
    const playDocId = play.timestamp.toString();
    return weekCollection(userId).doc(weekId).collection('plays').doc(playDocId).delete();
};

export const resetPlaysForWeek = async (userId: string, weekId: string) => {
    const playsSnapshot = await weekCollection(userId).doc(weekId).collection('plays').get();
    if (playsSnapshot.empty) return Promise.resolve();
    
    const batch = db.batch();
    playsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    return batch.commit();
};


// Real-time listener for user settings
export const listenToUserSettings = (userId: string, callback: (settings: any) => void) => {
    return usersCollection().doc(userId).onSnapshot((doc: any) => {
        if (doc.exists) {
            callback(doc.data() || {});
        } else {
            callback({}); // No settings found, return empty object
        }
    }, (error: any) => {
        console.error("Error listening to user settings:", error);
        callback({}); // On error, return empty object
    });
};

// Function to save user settings
export const saveUserSettingsToFirebase = (userId: string, settings: any) => {
    const cleanSettings = removeUndefinedValues(settings);
    return usersCollection().doc(userId).set(cleanSettings, { merge: true });
};


// Admin functions
const addUserCallable = functions.httpsCallable('addUser');
const deleteUserCallable = functions.httpsCallable('deleteUser');
const updateUserCallable = functions.httpsCallable('updateUser');
const listUsersCallable = functions.httpsCallable('listUsers');

export const createUser = (email: string, password: string, role: string, teamName?: string) => {
    return addUserCallable({ email, password, role, teamName });
};

export const deleteUser = (uid: string) => {
    return deleteUserCallable({ uid });
};

export const updateUser = (uid: string, updates: { email?: string; password?: string }) => {
    return updateUserCallable({ uid, ...updates });
};

export const getAllUsers = async (): Promise<any[]> => {
    try {
        // PRIMARY: Try the cloud function for the most accurate data, including emails from Auth.
        const result = await listUsersCallable();
        const users = (result.data as any[] || []).map(user => ({
            ...user,
            createdAt: user.createdAt && user.createdAt._seconds 
                ? new Date(user.createdAt._seconds * 1000).toLocaleString() 
                : 'N/A'
        }));
        return users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    } catch (error) {
        console.warn("The 'listUsers' cloud function failed. This is the preferred method for fetching all user emails. Falling back to the Firestore 'users' collection. Emails for older users may be missing.", error);
        
        // FALLBACK: Query the 'users' collection directly.
        try {
            const usersSnapshot = await usersCollection().get();
            const usersData = usersSnapshot.docs.map((doc: any) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // The email field in Firestore is the fallback. It might be missing for users created before a certain fix.
                    createdAt: data.createdAt && data.createdAt.toDate 
                        ? data.createdAt.toDate().toLocaleString() 
                        : 'N/A'
                };
            });
            return usersData.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
        } catch (firestoreError) {
             console.error("Fallback to Firestore failed as well:", firestoreError);
             throw new Error("Could not fetch user list. The backend function is unavailable and the database query failed. Please check Firestore permissions.");
        }
    }
};


export const getAllTeamPlaysForSeason = async (userId: string, seasonWeeks: string[]): Promise<Play[]> => {
    const allPlays: Play[] = [];
    const promises = seasonWeeks.map(async (weekId) => {
        try {
            const playsSnapshot = await usersCollection().doc(userId).collection('weeks').doc(weekId).collection('plays').get();
            playsSnapshot.forEach((playDoc: any) => {
                const data = playDoc.data() as Play;
                allPlays.push(data);
            });
        } catch (error) {
            console.error(`Error fetching plays for week ${weekId}:`, error);
        }
    });
    
    await Promise.all(promises);
    return allPlays.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Fetches all data for all teams. This is a very expensive operation and should only be used in the admin panel.
 * It queries all users with the 'coach' role, then iterates through each of their 'weeks' subcollections.
 */
export const getAllTeamData = async (): Promise<any[]> => {
    console.log("Fetching all team data for admin panel...");
    // Firestore security rules must allow this global read for it to work.
    const usersSnapshot = await db.collection('users').where('role', '==', 'coach').get();
    
    // Using Promise.all to fetch weeks data in parallel for all users.
    const promises = usersSnapshot.docs.map(async (userDoc: any) => {
        const userData = userDoc.data();
        // Ensure user has a team name before processing
        if (!userData.teamName) return null;

        const weeksSnapshot = await userDoc.ref.collection('weeks').get();
        const weeksData: any[] = [];
        for (const weekDoc of weeksSnapshot.docs) {
            const weekData = weekDoc.data();
            const playsSnapshot = await weekDoc.ref.collection('plays').get();
            const plays = playsSnapshot.docs.map((playDoc: any) => playDoc.data());
            weeksData.push({
                weekId: weekDoc.id,
                ...weekData,
                playHistory: plays
            });
        }

        return {
            userId: userDoc.id,
            teamName: userData.teamName,
            teamCity: userData.teamCity,
            coachName: userData.coachName,
            ageGroup: userData.ageGroup,
            weeks: weeksData
        };
    });

    const results = await Promise.all(promises);
    console.log(`Fetched data for ${results.filter(Boolean).length} teams.`);
    return results.filter((r): r is any => r !== null);
};