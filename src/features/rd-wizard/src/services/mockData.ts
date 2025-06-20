import { 
  Category, 
  Area, 
  Focus, 
  ResearchActivity, 
  ResearchSubcomponent 
} from '../types';

// Mock data for the R&D activities selection
export const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Healthcare',
    areas: [
      {
        id: 'area1',
        name: 'Medical Innovations',
        categoryId: 'cat1',
        focuses: [
          {
            id: 'focus1',
            name: 'Aesthetic Treatments',
            areaId: 'area1',
            researchActivities: [
              {
                id: 'activity1',
                name: 'Aesthetic Services',
                focusId: 'focus1',
                description: 'Development and implementation of innovative aesthetic services and treatments',
                subcomponents: [
                  {
                    id: 'subcomp1',
                    name: 'Peptide Therapy for Growth Hormone Management',
                    activityId: 'activity1',
                    description: 'Implementation of peptide therapy for growth hormone management in aesthetic treatments',
                    timePercentage: 5,
                    frequencyPercentage: 80,
                    generalDescription: "Peptide therapy involves the use of small protein molecules, called peptides, to influence various physiological functions in the body. In the context of growth hormone management, peptide therapy aims to regulate the secretion and activity of growth hormone (GH) to address deficiencies or imbalances.",
                    hypothesis: "The administration of growth hormone-releasing peptides (GHRPs) in individuals with growth hormone deficiency will lead to a significant increase in serum growth hormone levels compared to baseline measurements.",
                    developmentalProcess: "The developmental process of integrating peptide therapy for growth hormone control involves several key steps. Initially, the clinician educates themselves and their staff about peptide therapy through training sessions, workshops, and educational materials."
                  },
                  {
                    id: 'subcomp2',
                    name: 'Peptide Therapy for Musculoskeletal Injury',
                    activityId: 'activity1',
                    description: 'Application of peptide therapy for treating musculoskeletal injuries',
                    timePercentage: 7,
                    frequencyPercentage: 70,
                    generalDescription: "Peptide therapy involves administering small protein molecules, peptides, to influence various physiological processes, including tissue repair and regeneration, making it beneficial in treating musculoskeletal injuries.",
                    hypothesis: "Administration of peptide therapy to patients with musculoskeletal injuries will lead to a significant reduction in pain levels and improvement in functional outcomes compared to conventional treatments or placebo.",
                    developmentalProcess: "The developmental process of integrating peptide therapy for patients with GI injury involves several key steps. Initially, the clinician educates themselves and their staff about peptide therapy through training sessions, workshops, and educational materials, ensuring everyone is familiar with the treatment protocol and its potential benefits and risks."
                  },
                  {
                    id: 'subcomp3',
                    name: 'Trusculpt Machine',
                    activityId: 'activity1',
                    description: 'Integration of Trusculpt machine for non-invasive body contouring',
                    timePercentage: 8,
                    frequencyPercentage: 60,
                    generalDescription: "In our pursuit to enhance wellness and body contouring treatments, we have integrated the innovative Trusculpt Machine into our service offerings. This advanced technology represents a pivotal development in non-invasive fat reduction and skin tightening procedures.",
                    hypothesis: "We hypothesize that the Trusculpt Machine will significantly enhance patient satisfaction by delivering noticeable fat reduction and skin tightening without the need for surgical interventions.",
                    developmentalProcess: "Our development process for incorporating the Trusculpt Machine into our CPG adheres to a structured experimental framework, involving the identification of an experimental group, systematic data collection and analysis, and iterative adjustments based on outcomes."
                  }
                ]
              },
              {
                id: 'activity2',
                name: 'Aesthetic Skin Services',
                focusId: 'focus1',
                description: 'Development and implementation of innovative skin treatments and services',
                subcomponents: [
                  {
                    id: 'subcomp4',
                    name: 'Initial Consultation and Anamnesis Protocol',
                    activityId: 'activity2',
                    description: 'Development of comprehensive initial consultation protocols for skin treatments',
                    timePercentage: 5,
                    frequencyPercentage: 90,
                    generalDescription: "The Initial Consultation and Anamnesis Protocol is a process used in Aesthetic Skin Services to collect a patient's medical history, perform a skin analysis, and assess their aesthetic concerns.",
                    hypothesis: "The implementation of the Initial Consultation and Anamnesis Protocol for Aesthetic Skin Services will result in a more comprehensive understanding of the patient's skin condition and a more accurate selection of appropriate treatments and products.",
                    developmentalProcess: "To modify the Initial Consultation and Anamnesis Protocol, the clinician should start by reviewing the latest research and guidelines related to the specific condition or concern that the patient presents with."
                  },
                  {
                    id: 'subcomp5',
                    name: 'Protocol Development: Microdermabrasion Facials',
                    activityId: 'activity2',
                    description: 'Creation of standardized protocols for microdermabrasion facial treatments',
                    timePercentage: 8,
                    frequencyPercentage: 75,
                    generalDescription: "Microdermabrasion Facials is a process used in Aesthetic Skin Services to develop a standard protocol for microdermabrasion facials that is safe and effective for patients.",
                    hypothesis: "The development of the Microdermabrasion Facial Protocol for Aesthetic Skin Services will lead to a significant improvement in skin texture, reduction of fine lines and wrinkles, and increased overall skin health and radiance in patients.",
                    developmentalProcess: "To modify the protocol for microdermabrasion facials, the clinician should review the latest research on microdermabrasion techniques and equipment."
                  }
                ]
              }
            ]
          },
          {
            id: 'focus2',
            name: 'Oncology',
            areaId: 'area1',
            researchActivities: [
              {
                id: 'activity3',
                name: 'Aquablation Therapy',
                focusId: 'focus2',
                description: 'Implementation of aquablation therapy for treating various conditions',
                subcomponents: [
                  {
                    id: 'subcomp6',
                    name: 'Robotics Control System Optimization',
                    activityId: 'activity3',
                    description: 'Optimization of robotics control systems for aquablation therapy',
                    timePercentage: 10,
                    frequencyPercentage: 60,
                    generalDescription: "We are pioneering the integration of optimized robotics control systems in aquablation therapy, a state-of-the-art treatment for benign prostatic hyperplasia (BPH).",
                    hypothesis: "We hypothesize that the integration of an optimized robotics control system in aquablation therapy will lead to a higher precision in tissue removal, a decrease in procedure time, and reduced post-operative complications compared to existing methods.",
                    developmentalProcess: "The developmental process for this innovative control system in aquablation therapy began with initial concept development, followed by prototype creation and bench testing to assess functionality and precision."
                  },
                  {
                    id: 'subcomp7',
                    name: 'Waterjet Technology Enhancements',
                    activityId: 'activity3',
                    description: 'Enhancements to waterjet technology for improved precision',
                    timePercentage: 8,
                    frequencyPercentage: 70,
                    generalDescription: "We are implementing waterjet technology in our aquablation therapy for treating benign prostatic hyperplasia (BPH).",
                    hypothesis: "We hypothesize that the utilization of waterjet technology in aquablation therapy will lead to more precise tissue removal, decreased operative time, and lower rates of postoperative complications compared to conventional methods.",
                    developmentalProcess: "The development process for incorporating waterjet technology into aquablation therapy began with a thorough analysis of existing surgical techniques and their limitations."
                  }
                ]
              }
            ]
          },
          {
            id: 'focus3',
            name: 'Health & Wellness',
            areaId: 'area1',
            researchActivities: [
              {
                id: 'activity4',
                name: 'Comprehensive Health Analysis',
                focusId: 'focus3',
                description: 'Development of comprehensive health analysis protocols',
                subcomponents: [
                  {
                    id: 'subcomp8',
                    name: 'Food Sensitivity Testing',
                    activityId: 'activity4',
                    description: 'Implementation of food sensitivity testing in health analysis',
                    timePercentage: 6,
                    frequencyPercentage: 85,
                    generalDescription: "A food sensitivity test is a diagnostic tool used to identify maternal sensitivities or intolerances to specific foods during pregnancy.",
                    hypothesis: "Our hypothesis is that the implementation of food sensitivity testing during pregnancy will result in a statistically significant reduction in adverse maternal reactions to specific foods.",
                    developmentalProcess: "The developmental process of integrating a food sensitivity test was a meticulous and collaborative effort."
                  },
                  {
                    id: 'subcomp9',
                    name: 'Hyperbaric Oxygen Treatment (HBOT)',
                    activityId: 'activity4',
                    description: 'Integration of hyperbaric oxygen treatment in wellness programs',
                    timePercentage: 9,
                    frequencyPercentage: 50,
                    generalDescription: "We are currently engaged in the development of a Clinical Practice Guideline (CPG) within our wellness clinic, specifically focusing on the utilization of Hyperbaric Oxygen Therapy (HBOT) as a diagnostic treatment.",
                    hypothesis: "We hypothesize that the inclusion of HBOT in our diagnostic protocols will lead to improved accuracy and efficiency in diagnosing certain medical conditions, particularly those related to tissue oxygenation and perfusion.",
                    developmentalProcess: "Our developmental process for integrating HBOT into our CPG follows a systematic and iterative approach, rooted in evidence-based practice and clinical experience."
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'area2',
        name: 'Dentistry Innovations',
        categoryId: 'cat1',
        focuses: [
          {
            id: 'focus4',
            name: 'Orthodontics',
            areaId: 'area2',
            researchActivities: [
              {
                id: 'activity5',
                name: 'Clear Aligner Development',
                focusId: 'focus4',
                description: 'Research and development of clear aligner technologies',
                subcomponents: [
                  {
                    id: 'subcomp10',
                    name: 'Anamnestic Protocol',
                    activityId: 'activity5',
                    description: 'Development of anamnestic protocols for clear aligner treatment',
                    timePercentage: 6,
                    frequencyPercentage: 90,
                    generalDescription: "We are developing anamnestic protocols tailored specifically for patients using clear aligners in orthodontic treatment.",
                    hypothesis: "We hypothesize that a comprehensive anamnestic approach, when applied before beginning treatment with clear aligners, will lead to superior treatment outcomes compared to standard procedures.",
                    developmentalProcess: "The developmental process for integrating anamnestic protocols into clear aligner therapy involves several stages, starting with the selection of appropriate imaging technologies followed by pilot testing in simulated environments."
                  },
                  {
                    id: 'subcomp11',
                    name: 'Digital Imaging Modification (CBCT)',
                    activityId: 'activity5',
                    description: 'Modification of CBCT imaging protocols for clear aligner treatment',
                    timePercentage: 5,
                    frequencyPercentage: 80,
                    generalDescription: "As part of our ongoing commitment to leveraging advanced technology for improving patient care in orthodontics, we are integrating intraoral scanners into our clinical practice guidelines (CPGs).",
                    hypothesis: "We hypothesize that the integration of intraoral scanners will lead to significant improvements in treatment planning accuracy, customization of treatments, and overall patient satisfaction across all areas of orthodontic practice.",
                    developmentalProcess: "Our development process adheres to a structured and rigorous experimental model, involving the identification of an experimental group, systematic testing and refinement of the integrated hook design, and comprehensive outcome analysis."
                  },
                  {
                    id: 'subcomp12',
                    name: 'Treatment Protocol Development (Invisalign)',
                    activityId: 'activity5',
                    description: 'Development of treatment protocols for Invisalign clear aligners',
                    timePercentage: 5,
                    frequencyPercentage: 75,
                    generalDescription: "In our ongoing mission to enhance orthodontic treatment options and outcomes, we are incorporating Invisalign, a clear aligner system, into our clinical practice guidelines (CPGs).",
                    hypothesis: "We hypothesize that Invisalign will offer superior patient satisfaction, improved aesthetic outcomes, and comparable or better treatment effectiveness compared to traditional braces.",
                    developmentalProcess: "Our developmental process for incorporating Invisalign into our CPGs involves several stages, starting with the selection of appropriate imaging technologies followed by pilot testing in simulated environments."
                  }
                ]
              },
              {
                id: 'activity6',
                name: 'Airway & Sleep Apnea',
                focusId: 'focus4',
                description: 'Research and development of orthodontic treatments for airway and sleep apnea',
                subcomponents: [
                  {
                    id: 'subcomp13',
                    name: 'Maxillary Skeletal Expanders for Sleep Disorders',
                    activityId: 'activity6',
                    description: 'Implementation of maxillary skeletal expanders for treating sleep disorders',
                    timePercentage: 7,
                    frequencyPercentage: 60,
                    generalDescription: "Maxillary skeletal expanders are dental devices designed to address sleep disorders, specifically those involving airway obstruction.",
                    hypothesis: "Implementing maxillary skeletal expanders (MSEs) in patients with sleep disorders will significantly enhance sleep outcomes.",
                    developmentalProcess: "The integration of maxillary skeletal expanders (MSEs) involves several key steps. Staff participation is vital, necessitating comprehensive training to acquaint the team with the technology, adjustments, and effective communication with patients about MSEs."
                  },
                  {
                    id: 'subcomp14',
                    name: 'Treatment of Sleep Apnea with CPAP',
                    activityId: 'activity6',
                    description: 'Integration of CPAP therapy in orthodontic treatment of sleep apnea',
                    timePercentage: 8,
                    frequencyPercentage: 50,
                    generalDescription: "Sleep apnea treatment with Continuous Positive Airway Pressure (CPAP) involves the use of a CPAP machine, a medical device that delivers a continuous flow of pressurized air through a mask worn over the nose or nose and mouth during sleep.",
                    hypothesis: "In the context of our private clinical trial with research and development initiatives, we hypothesize that the implementation of CPAP treatment for sleep apnea will lead to a statistically significant reduction in the apnea-hypopnea index (AHI).",
                    developmentalProcess: "Our developmental process for incorporating CPAP sleep apnea treatments involves a comprehensive approach to ensure optimal patient care and treatment outcomes."
                  }
                ]
              }
            ]
          },
          {
            id: 'focus5',
            name: 'Endodontics',
            areaId: 'area2',
            researchActivities: [
              {
                id: 'activity7',
                name: 'Endodontics/Root Canals',
                focusId: 'focus5',
                description: 'Research and development of endodontic treatments and root canal procedures',
                subcomponents: [
                  {
                    id: 'subcomp15',
                    name: 'Anamnestic Protocol',
                    activityId: 'activity7',
                    description: 'Development of anamnestic protocols for endodontic treatments',
                    timePercentage: 7,
                    frequencyPercentage: 90,
                    generalDescription: "Anamnestic Protocol is a systematic approach to collecting a patient's medical history and other relevant information related to their dental health.",
                    hypothesis: "Patients who undergo Endodontic/Root Canal treatment and receive a comprehensive Anamnestic Protocol will have a significantly lower incidence of post-operative complications, such as pain and infection, compared to patients who do not receive the Anamnestic Protocol.",
                    developmentalProcess: "To develop an Anamnestic Protocol, the clinician would need to consider the patient's medical and dental history to determine if there are any factors that could affect the treatment plan."
                  },
                  {
                    id: 'subcomp16',
                    name: 'Digital Imaging Modification (CBCT)',
                    activityId: 'activity7',
                    description: 'Modification of CBCT imaging protocols for endodontic treatments',
                    timePercentage: 5,
                    frequencyPercentage: 85,
                    generalDescription: "Digital Imaging Modification (CBCT) is a type of dental imaging technology that uses cone-beam computed tomography to produce detailed three-dimensional images of the teeth, bones, and soft tissues of the oral cavity.",
                    hypothesis: "More effective than traditional 2D radiographs in detecting the presence of extra canals and anatomical variations in Endodontic/Root Canal treatment, leading to more accurate diagnosis and successful treatment outcomes.",
                    developmentalProcess: "The clinician can modify the Digital Imaging Modification (CBCT) technique by incorporating specific resources and involving trained staff to improve the quality of imaging and reduce radiation exposure."
                  },
                  {
                    id: 'subcomp17',
                    name: 'File System Protocol (Dentsply ProTaper)',
                    activityId: 'activity7',
                    description: 'Development of file system protocols using Dentsply ProTaper',
                    timePercentage: 5,
                    frequencyPercentage: 80,
                    generalDescription: "Dentsply ProTaper is a file system protocol used in endodontic treatment to prepare the root canal for obturation.",
                    hypothesis: "Result in higher success rates and decreased procedural time for endodontic/root canal treatment compared to the traditional Dentsply ProTaper file system protocol.",
                    developmentalProcess: "The clinician can modify the File System Protocol (Dentsply ProTaper) by incorporating specific resources, staff involvement and training, and keeping up with the latest research and development to ensure safe and effective root canal treatment."
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// Helper function to get all areas from all categories
export const getAllAreas = (): Area[] => {
  return mockCategories.flatMap(category => category.areas);
};

// Helper function to get all focuses from all areas
export const getAllFocuses = (): Focus[] => {
  return getAllAreas().flatMap(area => area.focuses);
};

// Helper function to get all research activities from all focuses
export const getAllResearchActivities = (): ResearchActivity[] => {
  return getAllFocuses().flatMap(focus => focus.researchActivities);
};

// Helper function to get all subcomponents from all research activities
export const getAllSubcomponents = (): ResearchSubcomponent[] => {
  return getAllResearchActivities().flatMap(activity => activity.subcomponents);
};

// Helper function to get a specific category by ID
export const getCategoryById = (id: string): Category | undefined => {
  return mockCategories.find(category => category.id === id);
};

// Helper function to get a specific area by ID
export const getAreaById = (id: string): Area | undefined => {
  return getAllAreas().find(area => area.id === id);
};

// Helper function to get a specific focus by ID
export const getFocusById = (id: string): Focus | undefined => {
  return getAllFocuses().find(focus => focus.id === id);
};

// Helper function to get a specific research activity by ID
export const getResearchActivityById = (id: string): ResearchActivity | undefined => {
  return getAllResearchActivities().find(activity => activity.id === id);
};

// Helper function to get a specific subcomponent by ID
export const getSubcomponentById = (id: string): ResearchSubcomponent | undefined => {
  return getAllSubcomponents().find(subcomponent => subcomponent.id === id);
};

// Helper function to get all research activities for a specific focus
export const getResearchActivitiesByFocusId = (focusId: string): ResearchActivity[] => {
  return getAllResearchActivities().filter(activity => activity.focusId === focusId);
};

// Helper function to get all subcomponents for a specific research activity
export const getSubcomponentsByActivityId = (activityId: string): ResearchSubcomponent[] => {
  return getAllSubcomponents().filter(subcomponent => subcomponent.activityId === activityId);
};