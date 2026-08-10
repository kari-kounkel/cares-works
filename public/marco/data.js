/* MARCO RCO Certification — the 15 evaluation sections (MN Statute 254B.05, subd. 1(d)).
   wr = written-review Yes/No determination rows.  sv = site-visit observation rows (3-point scale). */
window.MARCO_SECTIONS = [
  { n:1, t:"Legal Structure", s:"254B.05, subd. 1(d)(1)",
    guide:"Independent 501(c)(3), free from conflicting self-interests, autonomous in decision-making.",
    wr:[
      "Do the organization's Bylaws require more than 50% of board members to self-identify as people in personal recovery from SUD?",
      "Is the organization organized and operated as a nonprofit?",
      "Has the IRS determined it to be a 501(c)(3) (or does it operate under a MARCO-approved fiscal sponsorship with a 501(c)(3) entity)?",
      "Does the organization have any legal, financial, or contractual relationships that might impact its independence/autonomy?"
    ],
    sv:[
      "The organization has a mix of funding and/or in-kind support that enables it to perform its RCO functions.",
      "The organization's own staff/volunteers (not an outside agency) develop and deliver its mission-critical programs.",
      "The organization is free from conflicts of interest that might compromise its autonomy and integrity as an RCO."
    ] },
  { n:2, t:"Governance", s:"254B.05, subd. 1(d)(2)",
    guide:"Led and governed by the recovery community.",
    wr:[
      "Do 50% or more of Board members self-identify as in personal recovery from SUD?",
      "Does the organization have at least 3 Board members?",
      "Are the Board President/Chair and Board Treasurer positions filled?",
      "Are the Chair and Treasurer roles held by two different people?",
      "Do key staff leadership roles include people who self-identify as having lived SUD/recovery experience?",
      "Do key staff have relevant experience/skills/qualifications for leading an RCO?"
    ],
    sv:[
      "Board members self-disclose their personal experience with SUD and recovery.",
      "Staff and volunteers self-disclose their personal experience with SUD and recovery.",
      "People with lived experience make key decisions, run day-to-day operations, and deliver services.",
      "Key leadership is knowledgeable about RCO values and nonprofit operations."
    ] },
  { n:3, t:"Recovery from Substance Use Disorder Focus", s:"254B.05, subd. 1(d)(3)",
    wr:[
      "Are recovery and/or SUD identified in the organization's mission?",
      "Are recovery and/or SUD identified in the organization's vision?",
      "Is the organization conducting activities with a primary focus on recovery from SUD (verifiable)?",
      "Are approximately 80% of programs/activities/services focused on recovery from SUD?",
      "If it offers non-SUD-focused programs, is there a rationale for how they support long-term recovery?"
    ],
    sv:[
      "SUD recovery support resources are evident on the physical and/or virtual site.",
      "Staff/volunteers conduct activities intended to strengthen recovery from SUD.",
      "Staff/volunteers provide specific examples of how their work has helped people strengthen recovery.",
      "Most of the organization's programs, activities, or services have a primary focus of recovery from SUD.",
      "Public communications and advocacy are primarily focused on SUD recovery.",
      "If other (non-SUD) services are offered, the organization shows the purpose is to strengthen recovery from SUD."
    ] },
  { n:4, t:"Ongoing Community Engagement", s:"254B.05, subd. 1(d)(4)",
    wr:[
      "Does the organization identify a primary region or population it serves?",
      "Was the primary community served involved in the organization's establishment and development?",
      "Does the organization conduct ongoing programs/events engaging its primary region/population (verifiable)?",
      "Does the organization conduct ongoing programs/events open to the general public (verifiable)?",
      "Did the references complete the survey sent to them?",
      "If yes, do the references' responses reflect support for the organization's community work?"
    ],
    sv:[
      "The organization serves a defined community (geographic, shared experience, or cultural).",
      "A broad range of people reflecting the community served have been involved in its development and growth.",
      "The organization regularly conducts outreach to the public to raise awareness about SUD and recovery.",
      "The organization regularly provides opportunities for community members to volunteer.",
      "The organization regularly hosts recovery-supportive events the general public can join.",
      "The organization partners with, and participates in, recovery-supportive public events with other groups."
    ] },
  { n:5, t:"Accountability to the Recovery Community", s:"254B.05, subd. 1(d)(5)",
    wr:[
      "Does the organization have formal structures meaningfully involving the recovery community in decisions, planning, and evaluation (verifiable)?",
      "Is the organization using community input to shape planning, priorities, and/or program development (verifiable)?",
      "Does the organization demonstrate transparency by publicly sharing its work, goals, and strategies?",
      "Does the organization offer opportunities for community members to volunteer or otherwise participate?"
    ],
    sv:[
      "The organization uses surveys, listening sessions, advisory boards, or other formal tools to gather community input.",
      "The organization set its priorities and developed its programs with involvement from the community it serves.",
      "Community members volunteer to help the organization plan and implement its programs or services.",
      "The organization demonstrates transparency by publicly sharing its work, goals, and strategies."
    ] },
  { n:6, t:"Non-Clinical Peer Recovery Support", s:"254B.05, subd. 1(d)(6)",
    wr:[
      "Does the organization provide peer-led, recovery-oriented programs/services (verifiable as regularly offered/used)?",
      "Are those services consistently delivered by people with lived experience of SUD/recovery?",
      "Can the general public easily find and access the peer-based recovery support services?",
      "Can anyone participate regardless of Medicaid enrollment?",
      "If it also provides clinical services, does the rationale identify a community need?",
      "If it also provides clinical services, do they make up less than 25% of overall operations?",
      "If it also provides clinical services, is there a clear separation between the RCO and clinical services?"
    ],
    sv:[
      "The organization provides a variety of peer-to-peer recovery support services.",
      "The people delivering the services have personal experience with SUD and recovery.",
      "The majority of the organization's services are not clinical.",
      "Information about the services, and how to access them, is easy for the public to find.",
      "Anyone can participate regardless of Medicaid enrollment status.",
      "If clinical services are provided, there is clear separation and no compulsion either way."
    ] },
  { n:7, t:"All Pathways of Recovery", s:"254B.05, subd. 1(d)(7)",
    wr:[
      "Has the organization adopted a written policy affirming commitment to all pathways of recovery?",
      "Does it have written position descriptions for staff/volunteer PRSS roles?",
      "Do those descriptions state PRS roles will refer individuals to alternate supports if the RCO can't meet their needs?",
      "Does the organization provide services reflecting diverse pathways including harm reduction (verifiable)?",
      "Are the organization's public communications inclusive of all pathways?",
      "Does the organization regularly train staff/volunteers on multiple pathways, including harm reduction?"
    ],
    sv:[
      "The organization is inclusive of all pathways of recovery.",
      "The organization does not promote one pathway as the only option.",
      "The organization has policies and practices that support harm reduction.",
      "The organization connects people to services that support the individual's chosen pathway.",
      "Public spaces support and promote multiple pathways, including harm reduction."
    ] },
  { n:8, t:"Diversity, Equity, and Inclusion", s:"254B.05, subd. 1(d)(8)",
    wr:[
      "Has the organization adopted a board-approved written non-discrimination policy?",
      "Are board, staff, and volunteers trained on cultural humility and equity?",
      "Has the organization implemented practices to meet the needs of underrepresented/marginalized populations?",
      "Are the organization's public spaces welcoming to people from marginalized populations?",
      "Are the organization's sites accessible for people with disabilities?"
    ],
    sv:[
      "The organization has board, staff, and/or volunteers from underrepresented or marginalized populations.",
      "People can give examples of personal learning/growth from JEDI training the organization had them complete.",
      "The organization has implemented practices to meet the needs of underrepresented or marginalized populations.",
      "Public spaces are welcoming to people from underrepresented or marginalized populations.",
      "The organization's physical and/or virtual sites are accessible for people with disabilities."
    ] },
  { n:9, t:"Recovery Friendly Language", s:"254B.05, subd. 1(d)(9)",
    wr:[
      "Does the organization train board, staff, and volunteers on recovery-friendly language?",
      "Does it regularly review printed and online materials for stigmatizing language?",
      "Does it conduct public activities using recovery-friendly communications to reduce stigma and model hope?",
      "Does it consistently use person-centered language across website, social media, and print?",
      "Does it provide documentation of its recovery-friendly-language use and related activities?"
    ],
    sv:[
      "Staff/volunteers use person-centered and non-stigmatizing language in their communications.",
      "The organization's sites have person-centered, non-stigmatizing language throughout.",
      "The organization has practices to ensure recovery-friendly language (training, regular material reviews).",
      "The organization's public activities use recovery-friendly communications to reduce stigma and model hope."
    ] },
  { n:10, t:"Ethics and Grievance Policies", s:"254B.05, subd. 1(d)(10)",
    wr:[
      "Does the organization have a code of ethics reflecting RCO values (accountability, transparency, person-centered)?",
      "Is the code of ethics visible on the organization's website?",
      "Does the organization have a grievance policy and procedure?",
      "Are the grievance policy and procedures visible on the organization's website?"
    ],
    sv:[
      "The organization's code of ethics is public and easily accessible on site.",
      "The organization has a grievance policy and procedure easily accessible on site."
    ] },
  { n:11, t:"Peer Recovery Specialist Classification", s:"254B.05, subd. 1(d)(11)-(12)",
    wr:[
      "Does the organization classify any of its Peer Recovery Specialists as independent contractors?",
      "Does the organization treat any of its Peer Recovery Specialists as independent contractors?"
    ],
    sv:[
      "Peer Recovery Specialist employees discuss their work and compensation.",
      "PRS employees are not classified as independent contractors.",
      "PRS employees are not incentivized to recruit participants.",
      "PRS employees are paid for all hours required to perform the duties of the job."
    ] },
  { n:12, t:"Recovery Peer Orientation", s:"254B.05, subd. 1(d)(13)",
    wr:[
      "Does the organization have written materials to orient PRS and staff to the Ombudsman for Mental Health and Developmental Disabilities and other advocacy services?",
      "Does it orient its PRS upon hire to those advocacy services?",
      "Does it regularly review those advocacy services with its PRS and other staff?"
    ],
    sv:[
      "Written Ombudsman/advocacy materials are readily available on site.",
      "Peer Recovery Specialists can discuss how the organization orients them to those services.",
      "Peer Recovery Specialists are familiar with those services."
    ] },
  { n:13, t:"Participant Notice", s:"254B.05, subd. 1(d)(14)",
    wr:[
      "Does the organization have a notice provided to participants covering the info required by 254B.05, subd. 1(d)(14)?",
      "Does it have an established process for ensuring participants receive that required information?",
      "Does it provide other consumer-rights information (e.g., participant bill of rights, or a guide to what PRSS is/isn't)?"
    ],
    sv:[
      "The organization has an established process for providing the required participant notice.",
      "The organization provides other consumer-protection information.",
      "That consumer-protection information is readily available on site.",
      "Participants could describe their rights, what PRSS is, and available consumer-advocacy resources."
    ] },
  { n:14, t:"Closure Plans", s:"254B.05, subd. 1(d)(15)",
    guide:"Only applies to organizations enrolled with Minnesota Health Care Programs (MHCP).",
    wr:[
      "Does the organization have a board-approved 'Transfer of Participants and Records' policy?",
      "Does it have current signed plans (with specific organizations identified) detailing how active and inactive participants and records will be transferred upon closure?"
    ],
    sv:[
      "The organization has current signed transfer plans, with specific organizations identified, for participants and records in the event of closure."
    ] },
  { n:15, t:"RCO Core Strategies", s:"Faces & Voices National Standards; 254B.01, subd. 8",
    guide:"Policy advocacy, public education & awareness, and peer-to-peer recovery support services.",
    wr:[
      "Does the organization engage in advocacy activities to promote recovery-supportive public policies?",
      "Does it provide detailed descriptions/documentation of its policy-advocacy activities?",
      "Does it provide recovery-focused community education and outreach activities?",
      "Does it provide peer-based recovery support services?"
    ],
    sv:[
      "Staff/volunteers discussed various advocacy activities to promote recovery-supportive public policies.",
      "Staff/volunteers discussed recovery-focused community education and outreach activities.",
      "Staff/volunteers discussed a variety of peer-based recovery support services."
    ] }
];
