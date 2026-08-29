/* =====================================================================
   Paw Homie eligibility quiz — questions supplied by Bilal.

   Rules (from Bilal):
     - 10 questions, multiple choice
     - Pass mark 80% (8 of 10)
     - The score is shown on the Paw Homie's profile
     - Passing does NOT auto-approve: an admin reviews and has the
       final say on who gets approved
   ===================================================================== */

window.QUIZ = {
  passMark: 0.8,          // 80%
  questions: [
    { q:'A dog arrives at your home and seems scared or nervous. What should you do?',
      options:[
        'Give the dog space and let them settle in at their own pace.',
        'Hug them immediately.',
        'Introduce them to every room right away.',
        'Force them to play.'],
      answer:0 },

    { q:'A cat hides under your bed after arriving. What should you do?',
      options:[
        'Pull the cat out.',
        'Give the cat a quiet space and let them come out when they\u2019re comfortable.',
        'Chase the cat around the room.',
        'Leave all the doors open.'],
      answer:1 },

    { q:'Before accepting a boarding booking, what is most important to know?',
      options:[
        'The pet\u2019s favourite toy.',
        'The pet\u2019s medical needs, behaviour, allergies, and emergency contact information.',
        'The owner\u2019s favourite food.',
        'The pet\u2019s Instagram account.'],
      answer:1 },

    { q:'A boarded dog suddenly begins vomiting several times and seems weak. What should you do?',
      options:[
        'Wait until tomorrow.',
        'Contact the owner immediately and seek emergency veterinary care if necessary.',
        'Ignore it.',
        'Give the dog more food.'],
      answer:1 },

    { q:'A pet owner leaves detailed feeding instructions. What should you do?',
      options:[
        'Feed more because the pet looks hungry.',
        'Follow the owner\u2019s instructions exactly unless they tell you otherwise.',
        'Feed your own pet\u2019s food.',
        'Skip a meal if you\u2019re busy.'],
      answer:1 },

    { q:'Which home safety step is the most important before a pet arrives?',
      options:[
        'Make sure your TV works.',
        'Remove hazards and ensure doors, gates, and fences are secure.',
        'Open all windows.',
        'Leave cleaning products on the floor.'],
      answer:1 },

    { q:'A boarded pet accidentally escapes through an open door. What should you do first?',
      options:[
        'Wait for them to come back.',
        'Stay calm, begin searching safely, and contact the owner immediately.',
        'Finish your chores first.',
        'Post on social media before contacting the owner.'],
      answer:1 },

    { q:'A dog in your care starts growling at another pet in your home. What should you do?',
      options:[
        'Let them figure it out.',
        'Safely separate the pets and monitor them.',
        'Lock them together in one room.',
        'Ignore the behaviour.'],
      answer:1 },

    { q:'A pet owner asks for daily photo updates. What should you do?',
      options:[
        'Send updates only if something goes wrong.',
        'Send regular updates and photos as agreed with the owner.',
        'Never respond.',
        'Only update them when they ask.'],
      answer:1 },

    { q:'What is the most important responsibility of a Paw Homie?',
      options:[
        'Having the biggest house.',
        'Keeping every pet safe, comfortable, and following the owner\u2019s care instructions.',
        'Finishing bookings as quickly as possible.',
        'Taking lots of social media photos.'],
      answer:1 }
  ]
};
