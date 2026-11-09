import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student, AttendanceRecord, GradeRecord, Subject, Assessment, Homework, DisciplineRecord } from '../types';

export const cloudSync = {
  // Sync individual student to Firestore
  syncStudent: async (student: Student) => {
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `students/${student.id}`);
    }
  },

  deleteStudent: async (studentId: string) => {
    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${studentId}`);
    }
  },

  // Sync attendance to Firestore
  syncAttendance: async (record: AttendanceRecord) => {
    try {
      await setDoc(doc(db, 'attendance', record.id), record);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${record.id}`);
    }
  },

  // Sync grades to Firestore
  syncGrade: async (grade: GradeRecord) => {
    try {
      await setDoc(doc(db, 'grades', grade.id), grade);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `grades/${grade.id}`);
    }
  },

  // Sync entire batch to Cloud Firestore
  syncAllToCloud: async (data: {
    students: Student[];
    attendance: AttendanceRecord[];
    grades: GradeRecord[];
    subjects: Subject[];
    assessments: Assessment[];
    homeworks: Homework[];
    discipline: DisciplineRecord[];
  }) => {
    try {
      const promises: Promise<void>[] = [];

      for (const st of data.students) {
        promises.push(setDoc(doc(db, 'students', st.id), st));
      }
      for (const att of data.attendance) {
        promises.push(setDoc(doc(db, 'attendance', att.id), att));
      }
      for (const grd of data.grades) {
        promises.push(setDoc(doc(db, 'grades', grd.id), grd));
      }
      for (const sub of data.subjects) {
        promises.push(setDoc(doc(db, 'subjects', sub.id), sub));
      }
      for (const ass of data.assessments) {
        promises.push(setDoc(doc(db, 'assessments', ass.id), ass));
      }
      for (const hw of data.homeworks) {
        promises.push(setDoc(doc(db, 'homeworks', hw.id), hw));
      }
      for (const disc of data.discipline) {
        promises.push(setDoc(doc(db, 'discipline', disc.id), disc));
      }

      await Promise.all(promises);
      return { success: true, count: promises.length };
    } catch (err) {
      console.error('Failed to sync all data to cloud:', err);
      throw err;
    }
  },

  // Real-time listener setup for students
  subscribeStudents: (onUpdate: (students: Student[]) => void) => {
    return onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as Student);
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'students');
      }
    );
  },

  // Real-time listener for attendance
  subscribeAttendance: (onUpdate: (records: AttendanceRecord[]) => void) => {
    return onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as AttendanceRecord);
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'attendance');
      }
    );
  }
};
