// Automated Email & Alert Service for Candidates and Admin

/**
 * Send candidate registration confirmation email
 */
const sendRegistrationEmail = async ({ candidateName, candidateEmail, jobName, applyToken }) => {
  try {
    const timestamp = new Date().toLocaleString();
    console.log(`\n========== 📧 AUTOMATED EMAIL DISPATCH ==========`);
    console.log(`TO: ${candidateName} <${candidateEmail}>`);
    console.log(`SUBJECT: Registration Successful - Forge India Connect Assessment`);
    console.log(`BODY:`);
    console.log(`Dear ${candidateName},`);
    console.log(`You have successfully registered for the assessment track: "${jobName || 'General Track'}".`);
    console.log(`Registration Time: ${timestamp}`);
    console.log(`Please keep an eye on your inbox for your unique assessment link.`);
    console.log(`====================================================\n`);
    return { success: true, message: 'Email dispatched successfully' };
  } catch (err) {
    console.error('Failed to send registration email:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send candidate test completion scorecard email
 */
const sendAssessmentCompletionEmail = async ({ candidateName, candidateEmail, jobName, score, totalQuestions, percentage }) => {
  try {
    const timestamp = new Date().toLocaleString();
    console.log(`\n========== 📧 AUTOMATED SCORECARD EMAIL DISPATCH ==========`);
    console.log(`TO: ${candidateName} <${candidateEmail}>`);
    console.log(`SUBJECT: Assessment Completed - ${jobName || 'FIC Assessment'}`);
    console.log(`BODY:`);
    console.log(`Dear ${candidateName},`);
    console.log(`Thank you for completing your assessment for: "${jobName || 'Assessment Track'}".`);
    console.log(`Result Summary:`);
    console.log(`- Score: ${score}/${totalQuestions}`);
    console.log(`- Percentage: ${percentage}%`);
    console.log(`- Completed At: ${timestamp}`);
    console.log(`Our recruitment team will review your report shortly.`);
    console.log(`===========================================================\n`);
    return { success: true, message: 'Scorecard email dispatched successfully' };
  } catch (err) {
    console.error('Failed to send completion email:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendRegistrationEmail,
  sendAssessmentCompletionEmail
};
