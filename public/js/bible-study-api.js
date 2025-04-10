// Bible Study API Client
class BibleStudyAPI {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
    this.token = localStorage.getItem('auth_token') || '';
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = '';
    localStorage.removeItem('auth_token');
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      this.setToken(data.access_token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async generateExplanation(verses, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/bible-study/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          verses,
          ...options
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate explanation');
      }

      return await response.json();
    } catch (error) {
      console.error('Generate explanation error:', error);
      throw error;
    }
  }

  // Demo function that simulates explanation generation without API
  simulateExplanation(verses, options = {}) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const explanations = {};

        verses.forEach(verse => {
          // Check if we have a demo explanation for common verses
          let explanation = '';
          
          if (verse.includes('John 3:16')) {
            explanation = this.getDemoExplanation('John 3:16', options);
          } else if (verse.includes('Romans 8:28')) {
            explanation = this.getDemoExplanation('Romans 8:28', options);
          } else if (verse.includes('Psalm 23')) {
            explanation = this.getDemoExplanation('Psalm 23', options);
          } else {
            explanation = this.getGenericExplanation(verse, options);
          }

          explanations[verse] = {
            verse,
            explanation,
            options
          };
        });

        resolve({
          explanations,
          status: 'success'
        });
      }, 1500);
    });
  }

  getDemoExplanation(verse, options) {
    const depth = options.depth || 'standard';
    const style = options.style || 'educational';
    
    // Common demo verses
    const demoContent = {
      'John 3:16': {
        verse: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        basic: 'This verse shows God's great love for all people. He gave His Son Jesus so that anyone who believes in Him can have eternal life instead of being separated from God forever.',
        standard: `John 3:16 is often called "the gospel in a nutshell" because it concisely expresses the core message of Christianity. The verse appears in Jesus' conversation with Nicodemus and reveals several key theological concepts:

1. God's love is the motivation for salvation - "For God so loved the world"
2. This love extends universally - "the world" (kosmos in Greek)  
3. God's gift was sacrificial - "he gave his one and only Son"
4. Salvation requires a response - "whoever believes in him"
5. The consequences are eternal - "shall not perish but have eternal life"

In its historical context, this revolutionary statement challenged the prevailing Jewish understanding that God's special love was primarily for Israel. Instead, Jesus declares God's love extends to all humanity, regardless of ethnicity or social status.`,
        academic: `John 3:16, situated within Jesus' nocturnal dialogue with Nicodemus, stands as a paradigmatic articulation of soteriological principles within Johannine theology. The verse employs the Greek term "οὕτως" (houtos), which can be translated as "in this manner" rather than merely intensifying God's love ("so loved"), suggesting a qualitative rather than quantitative emphasis.

The object of divine love—"τὸν κόσμον" (ton kosmon)—carries multivalent significance in Johannine literature, often denoting the created order estranged from God (cf. John 1:10, 17:14-16). This presents a striking theological juxtaposition: God's love extends precisely to that which stands in opposition to divine purposes.

The unilateral divine initiative is emphasized through the aorist verb "ἔδωκεν" (edōken), indicating a completed action of giving that centers on the incarnational and sacrificial work of the "μονογενῆ" (monogenē)—the unique, one-of-a-kind Son. This terminology carries echoes of the Abrahamic narrative (Genesis 22), where the patriarch was called to sacrifice his "only son."

The soteriological framework presents a binary eschatological outcome contingent upon faith response: eternal destruction ("ἀπόληται" - apolētai) versus eternal life ("ζωὴν αἰώνιον" - zōēn aiōnion). This represents not merely extended temporal existence but qualitative participation in divine life, a central Johannine theme (cf. John 17:3).`
      },
      'Romans 8:28': {
        verse: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        basic: 'This verse promises that God will make good things come from all situations for people who love Him and follow His plan. Even when bad things happen, God can use them for something good in the end.',
        standard: `Romans 8:28 offers profound assurance to believers facing trials and suffering. Written by Paul to the church in Rome around 57 AD, this verse appears in a chapter focusing on life in the Spirit and the ultimate glory awaiting believers.

Key elements include:
- "We know" - Expressing certainty based on God's revealed character
- "All things" - Comprehensive scope including both positive and negative experiences
- "Works together" (synergei in Greek) - God actively coordinates multiple factors
- "For good" - Not necessarily comfort or happiness, but ultimate spiritual benefit
- "Those who love God" - A qualifying statement indicating this promise is for believers
- "Called according to his purpose" - References God's sovereign plan

Historical context: The early Christians in Rome faced increasing persecution under Emperor Nero. This promise would have been especially meaningful to believers facing uncertainty and suffering.

This verse doesn't promise absence of suffering, but rather that God's redemptive purposes will ultimately prevail. The subsequent verses clarify the "good" as conformity to Christ's image (v.29) and ultimate glorification (v.30).`,
        academic: `Romans 8:28 constitutes a pivotal nexus within Paul's soteriological and pneumatological discourse. The verse employs the perfect οἴδαμεν ("we know") indicating established conviction rather than progressive acquisition of knowledge, and the coordinating conjunction δέ connects this confident assertion with the preceding pneumatological discourse concerning the Spirit's intercessory ministry.

The phrase πάντα συνεργεῖ presents significant text-critical considerations. The Byzantine textform reads ὁ θεός as the explicit subject (making God the active agent), while earlier manuscripts (א, B, A) present the verb συνεργεῖ intransitively, suggesting "all things work together." The theological import remains substantively consistent either way; divine providence orchestrates circumstances toward redemptive purposes.

The present tense of συνεργεῖ denotes continuous divine activity rather than isolated interventions, while the prefix συν- emphasizes the cooperative synergy of multiple factors in producing a unified outcome. The beneficiaries are delimited by the articular τοῖς ἀγαπῶσιν, identifying divine love recipients who reciprocate that love.

The appositive phrase τοῖς κατὰ πρόθεσιν κλητοῖς introduces Paul's subsequent predestinarian exposition in verses 29-30. The πρόθεσις (purpose) represents God's eternal counsel, while κλητοῖς (called ones) refers to effectual calling, not merely invitation.

In socio-rhetorical context, Paul offers theodicean assurance to a community facing systemic persecution under Neronian policies. The verse functions as a transitional fulcrum between Paul's treatment of present suffering (8:18-27) and ultimate eschatological triumph (8:31-39).`
      },
      'Psalm 23': {
        verse: 'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake...',
        basic: 'This psalm compares God to a shepherd who takes care of sheep. It says God provides everything we need, gives us rest, guides us, and protects us even in dangerous places. It promises that God's goodness will always be with us.',
        standard: `Psalm 23 is perhaps the most beloved psalm in the Bible, composed by David who drew from his own experience as a shepherd before becoming king of Israel (approximately 1000 BCE).

The psalm employs extended pastoral metaphor, portraying God (YHWH) as a shepherd and the psalmist as a sheep entirely dependent on the shepherd's care. This imagery would have been immediately relatable in an agricultural society.

The psalm can be divided into two main sections:
1. Verses 1-4: God as shepherd, providing sustenance, rest, guidance, and protection
2. Verses 5-6: God as host, providing hospitality and blessing

Key themes include:
- Divine provision: "I lack nothing" (v.1)
- Rest and renewal: "green pastures," "quiet waters," "refreshes my soul" (v.2-3)
- Divine guidance: "right paths" (v.3)
- Divine protection: "through the darkest valley" (v.4)
- Divine comfort: "your rod and your staff, they comfort me" (v.4)
- Divine abundance: "my cup overflows" (v.5)
- Divine faithfulness: "all the days of my life" (v.6)

For ancient Israelites, this psalm would have evoked both the exodus experience (God as shepherd) and covenant blessings. For Christians, the imagery connects to Jesus as the Good Shepherd (John 10).`,
        academic: `Psalm 23, a lyrical masterpiece attributed to David in the superscription, exemplifies the poetic genre of trust psalms (Gattung: Vertrauenspsalm). Its symmetric structure exhibits intricate poetic devices including metaphoric transference, extended parallelism, and chiastic arrangement.

The psalm presents a compositional duality, transitioning from pastoral imagery (vv.1-4) to royal banquet motifs (vv.5-6). This represents not a disjointed juxtaposition but a sophisticated rhetorical progression from quotidian provision to eschatological abundance.

The tetragrammaton (יהוה) appears in verse 1, establishing a covenantal framework that undergirds the entire composition. The possessive pronoun in "my shepherd" (רֹעִי) establishes the personal nature of this relationship, contrasting with ancient Near Eastern conceptions where deities functioned as shepherds primarily of kings rather than individuals.

The pastoral lexicon includes technical shepherding terminology: "green pastures" (נְאוֹת דֶשֶׁא) references not merely aesthetic landscape but optimal grazing conditions; "still waters" (מֵי מְנֻחוֹת) indicates water sources appropriate for ovine consumption; and "paths of righteousness" (מַעְגְּלֵי־צֶדֶק) likely denotes well-worn routes rather than ethical abstractions.

The phrase גַּם כִּי־אֵלֵךְ בְּגֵיא צַלְמָוֶת (v.4) presents notable lexicographical challenges. While traditionally rendered "valley of the shadow of death," צַלְמָוֶת likely represents a compound noun denoting "deep darkness" rather than a death reference, though subsequent Jewish and Christian interpretive traditions consistently connect this to mortality.

Intertextually, this psalm exhibits resonances with ancient Near Eastern shepherd-king motifs (particularly Egyptian), while simultaneously subverting royal ideology by democratizing divine pastoral care to the individual supplicant.`
      }
    };
    
    // Return appropriate depth if available
    return demoContent[verse]?.[depth.toLowerCase()] || 
           demoContent[verse]?.standard || 
           `No demo explanation available for ${verse} at depth ${depth}`;
  }

  getGenericExplanation(verse, options) {
    const depth = options.depth || 'standard';
    
    const depthContent = {
      basic: `This is a simulated basic explanation for "${verse}". In a real implementation, this would provide a simple, straightforward explanation suitable for new believers or children.`,
      
      standard: `This is a simulated standard explanation for "${verse}". 

In a real implementation, this would provide a balanced interpretation including:
- Historical and cultural context
- Key theological concepts
- Cross-references to related passages
- Practical application points

This level of depth is appropriate for most adult Bible study groups and personal study.`,
      
      academic: `This is a simulated academic explanation for "${verse}".

In a real implementation, this would provide an in-depth scholarly analysis including:
- Original language word studies (Hebrew/Greek)
- Detailed historical-critical context
- Examination of various interpretive perspectives
- Intertextual connections within biblical canon
- Theological implications across different traditions

The academic depth is suited for seminary students, pastors preparing sermons, and advanced Bible study groups.`
    };
    
    return depthContent[depth.toLowerCase()] || depthContent.standard;
  }
}

// Export the API client
window.BibleStudyAPI = BibleStudyAPI;
