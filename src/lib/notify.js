// ============================================
// Notification helper
// ============================================
// Small wrapper around the `notifications` table so pages don't have to
// re-implement the insert logic every time an event happens.
//
// Every function is best-effort: failures are logged but never surfaced
// to the user via toast, because a notification failure should not block
// the underlying action (approving a match, submitting a logbook, etc.).
//
// Uses the admin client so notifications can be inserted for OTHER users
// (RLS on `notifications` only lets a user insert rows for themselves).

import { supabase, supabaseAdmin } from './supabase';

// ---------- core insert ----------

/**
 * Insert one notification row.
 * @param {object} n
 * @param {string} n.userId       - recipient's profile id (required)
 * @param {string} n.type         - one of info|success|warning|match|logbook|report|assessment
 * @param {string} n.title        - short headline
 * @param {string} n.message      - detail text
 * @param {string} [n.link]       - optional in-app route, e.g. "/dashboard/logbook"
 */
export async function notify({ userId, type = 'info', title, message, link = null }) {
  if (!userId || !title || !message) return;
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
    });
    if (error) console.error('notify() failed:', error);
  } catch (err) {
    console.error('notify() exception:', err);
  }
}

/**
 * Insert many notifications at once. Useful when the same event needs to
 * reach multiple recipients (e.g. "match approved" -> student AND org).
 */
export async function notifyMany(rows) {
  const cleaned = (rows || []).filter(r => r && r.userId && r.title && r.message);
  if (cleaned.length === 0) return;
  try {
    const { error } = await supabaseAdmin.from('notifications').insert(
      cleaned.map(r => ({
        user_id: r.userId,
        type: r.type || 'info',
        title: r.title,
        message: r.message,
        link: r.link || null,
      }))
    );
    if (error) console.error('notifyMany() failed:', error);
  } catch (err) {
    console.error('notifyMany() exception:', err);
  }
}

// ---------- helpers ----------

/**
 * Look up the IDs of every coordinator — used to broadcast events the
 * coordinator(s) should know about (new logbook, new report, etc.).
 */
export async function getCoordinatorIds() {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'coordinator');
    return (data || []).map(p => p.id);
  } catch (err) {
    console.error('getCoordinatorIds() exception:', err);
    return [];
  }
}

// ---------- typed event helpers ----------
// Each named helper documents who the recipients are and what the notification
// looks like. Keeping these in one place means the wording is consistent
// across the app.

/**
 * Sent when the coordinator approves a match.
 * Recipients: the student, the organization.
 */
export async function notifyMatchApproved({ studentId, studentName, orgId, orgName }) {
  await notifyMany([
    {
      userId: studentId,
      type: 'match',
      title: 'You have been matched!',
      message: `You have been placed with ${orgName || 'an organization'} for your industrial attachment.`,
      link: '/dashboard',
    },
    {
      userId: orgId,
      type: 'match',
      title: 'New student placement',
      message: `${studentName || 'A student'} has been placed with your organization.`,
      link: '/dashboard',
    },
  ]);
}

/**
 * Sent when a university supervisor is assigned (or reassigned) to a placement.
 * Recipients: the student, the supervisor, the organization.
 */
export async function notifySupervisorAssigned({
  studentId, studentName, supervisorId, supervisorName, orgId, orgName,
}) {
  await notifyMany([
    {
      userId: studentId,
      type: 'assessment',
      title: 'University supervisor assigned',
      message: `${supervisorName || 'A supervisor'} will be your university supervisor during your attachment.`,
      link: '/dashboard',
    },
    {
      userId: supervisorId,
      type: 'assessment',
      title: 'New student assigned',
      message: `${studentName || 'A student'} (placed at ${orgName || 'an organization'}) has been assigned to you.`,
      link: '/dashboard/assessments',
    },
    {
      userId: orgId,
      type: 'assessment',
      title: 'University supervisor assigned',
      message: `${supervisorName || 'A supervisor'} will be the university supervisor for ${studentName || 'your student'}.`,
      link: '/dashboard',
    },
  ]);
}

/**
 * Sent when a student submits a new logbook entry.
 * Recipients: their assigned supervisor (if any), all coordinators.
 */
export async function notifyLogbookSubmitted({ studentId, studentName, supervisorId, weekNumber }) {
  const recipients = [];
  if (supervisorId) {
    recipients.push({
      userId: supervisorId,
      type: 'logbook',
      title: 'New logbook entry',
      message: `${studentName || 'A student'} submitted their Week ${weekNumber} logbook.`,
      link: '/dashboard/logbooks',
    });
  }
  const coords = await getCoordinatorIds();
  for (const cid of coords) {
    recipients.push({
      userId: cid,
      type: 'logbook',
      title: 'New logbook entry',
      message: `${studentName || 'A student'} submitted their Week ${weekNumber} logbook.`,
      link: '/dashboard/logbooks',
    });
  }
  await notifyMany(recipients);
}

/**
 * Sent when a university supervisor submits a visit assessment.
 * Recipients: the student, all coordinators.
 */
export async function notifyUniAssessmentSubmitted({ studentId, supervisorName, score }) {
  const recipients = [
    {
      userId: studentId,
      type: 'assessment',
      title: 'University supervisor visit recorded',
      message: `${supervisorName || 'Your supervisor'} recorded an assessment from their visit${typeof score === 'number' ? ` (score: ${score}/100)` : ''}.`,
      link: '/dashboard',
    },
  ];
  const coords = await getCoordinatorIds();
  for (const cid of coords) {
    recipients.push({
      userId: cid,
      type: 'assessment',
      title: 'New university assessment',
      message: `${supervisorName || 'A supervisor'} submitted a visit assessment.`,
      link: '/dashboard/analytics',
    });
  }
  await notifyMany(recipients);
}

/**
 * Sent when an industrial supervisor (organization) submits their report.
 * Recipients: the student, all coordinators.
 */
export async function notifySupervisorReportSubmitted({ studentId, orgName, score }) {
  const recipients = [
    {
      userId: studentId,
      type: 'report',
      title: 'Industrial supervisor report submitted',
      message: `${orgName || 'Your organization'} submitted their end-of-attachment report${typeof score === 'number' ? ` (score: ${score}/100)` : ''}.`,
      link: '/dashboard',
    },
  ];
  const coords = await getCoordinatorIds();
  for (const cid of coords) {
    recipients.push({
      userId: cid,
      type: 'report',
      title: 'New industrial supervisor report',
      message: `${orgName || 'An organization'} submitted a supervisor report.`,
      link: '/dashboard/analytics',
    });
  }
  await notifyMany(recipients);
}

/**
 * Sent when a student submits their final report.
 * Recipients: their assigned supervisor (if any), all coordinators.
 */
export async function notifyStudentReportSubmitted({ studentName, supervisorId }) {
  const recipients = [];
  if (supervisorId) {
    recipients.push({
      userId: supervisorId,
      type: 'report',
      title: 'Student final report submitted',
      message: `${studentName || 'Your assigned student'} submitted their final report.`,
      link: '/dashboard/logbooks',
    });
  }
  const coords = await getCoordinatorIds();
  for (const cid of coords) {
    recipients.push({
      userId: cid,
      type: 'report',
      title: 'New student final report',
      message: `${studentName || 'A student'} submitted their final report.`,
      link: '/dashboard/analytics',
    });
  }
  await notifyMany(recipients);
}
