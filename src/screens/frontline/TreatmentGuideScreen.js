import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Searchbar,
  Chip,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const treatmentGuidelines = {
  tuberculosis: {
    title: 'Tuberculosis (TB)',
    icon: 'lungs',
    color: '#E53E3E',
    overview: 'TB is a bacterial infection that primarily affects the lungs but can affect other parts of the body.',
    symptoms: [
      'Persistent cough lasting more than 3 weeks',
      'Coughing up blood or sputum',
      'Chest pain',
      'Weakness or fatigue',
      'Weight loss',
      'Fever and night sweats'
    ],
    treatment: {
      firstLine: [
        'Isoniazid (INH) - 300mg daily',
        'Rifampin (RIF) - 600mg daily',
        'Ethambutol (EMB) - 1200mg daily',
        'Pyrazinamide (PZA) - 1500mg daily'
      ],
      duration: '6 months (2 months intensive phase + 4 months continuation phase)',
      monitoring: [
        'Monthly sputum tests',
        'Liver function tests',
        'Visual acuity checks (for Ethambutol)',
        'Weight monitoring'
      ]
    },
    emergencySignals: [
      'Severe breathing difficulty',
      'Coughing up large amounts of blood',
      'Severe abdominal pain (liver toxicity)',
      'Vision changes'
    ]
  },
  pneumonia: {
    title: 'Pneumonia',
    icon: 'lungs',
    color: '#3182CE',
    overview: 'Pneumonia is an infection that inflames air sacs in one or both lungs.',
    symptoms: [
      'Cough with phlegm or pus',
      'Fever and chills',
      'Difficulty breathing',
      'Chest pain when breathing or coughing',
      'Fatigue'
    ],
    treatment: {
      firstLine: [
        'Amoxicillin - 500mg three times daily',
        'Azithromycin - 500mg once daily',
        'Doxycycline - 100mg twice daily'
      ],
      duration: '5-10 days depending on severity',
      monitoring: [
        'Temperature monitoring',
        'Oxygen saturation',
        'Respiratory rate',
        'Clinical improvement assessment'
      ]
    },
    emergencySignals: [
      'Severe breathing difficulty',
      'Chest pain',
      'High fever (>39°C)',
      'Confusion or altered mental state'
    ]
  },
  malaria: {
    title: 'Malaria',
    icon: 'bug',
    color: '#38A169',
    overview: 'Malaria is a mosquito-borne infectious disease caused by parasites.',
    symptoms: [
      'Fever and chills',
      'Headache',
      'Muscle aches',
      'Fatigue',
      'Nausea and vomiting',
      'Sweating'
    ],
    treatment: {
      firstLine: [
        'Artemether-Lumefantrine (Coartem) - Weight-based dosing',
        'Artesunate + Amodiaquine - Weight-based dosing',
        'Quinine + Doxycycline (severe cases)'
      ],
      duration: '3 days for uncomplicated malaria',
      monitoring: [
        'Temperature monitoring',
        'Parasitemia levels',
        'Clinical improvement',
        'Side effects monitoring'
      ]
    },
    emergencySignals: [
      'Severe headache',
      'Confusion or seizures',
      'Difficulty breathing',
      'Severe anemia',
      'Kidney failure signs'
    ]
  },
  lung_cancer: {
    title: 'Lung Cancer',
    icon: 'lungs',
    color: '#805AD5',
    overview: 'Lung cancer requires immediate specialist referral for proper staging and treatment.',
    symptoms: [
      'Persistent cough',
      'Coughing up blood',
      'Shortness of breath',
      'Chest pain',
      'Unexplained weight loss',
      'Fatigue'
    ],
    treatment: {
      firstLine: [
        'IMMEDIATE SPECIALIST REFERRAL REQUIRED',
        'Supportive care only until specialist consultation',
        'Pain management as needed',
        'Nutritional support'
      ],
      duration: 'Varies based on staging and specialist recommendations',
      monitoring: [
        'Symptom progression',
        'Pain levels',
        'Nutritional status',
        'Respiratory function'
      ]
    },
    emergencySignals: [
      'Severe breathing difficulty',
      'Massive hemoptysis',
      'Severe chest pain',
      'Signs of superior vena cava syndrome'
    ]
  }
};

const generalGuidelines = [
  {
    title: 'Patient Assessment',
    icon: 'clipboard-check',
    content: [
      'Always take a complete medical history',
      'Perform thorough physical examination',
      'Document all symptoms and their duration',
      'Check vital signs (temperature, pulse, blood pressure, respiratory rate)',
      'Assess patient\'s general condition and level of distress'
    ]
  },
  {
    title: 'Medication Safety',
    icon: 'pill',
    content: [
      'Always check for drug allergies before prescribing',
      'Verify correct dosages based on patient weight and age',
      'Educate patients about proper medication administration',
      'Warn about potential side effects',
      'Ensure patient understands the importance of completing the full course'
    ]
  },
  {
    title: 'Follow-up Care',
    icon: 'calendar-check',
    content: [
      'Schedule appropriate follow-up appointments',
      'Provide clear instructions for home care',
      'Educate about warning signs that require immediate medical attention',
      'Ensure patient has access to medications',
      'Document all interactions and treatment responses'
    ]
  },
  {
    title: 'When to Refer',
    icon: 'hospital',
    content: [
      'Suspected cancer or serious malignancy',
      'Treatment failure after appropriate therapy',
      'Complications beyond your scope of practice',
      'Patient requires specialized diagnostic procedures',
      'Severe or life-threatening conditions'
    ]
  }
];

export default function TreatmentGuideScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});

  const categories = ['all', 'tuberculosis', 'pneumonia', 'malaria', 'lung_cancer', 'general'];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredGuidelines = Object.entries(treatmentGuidelines).filter(([key, guideline]) => {
    const matchesSearch = guideline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guideline.overview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || selectedCategory === key;
    return matchesSearch && matchesCategory;
  });

  const showGeneral = selectedCategory === 'all' || selectedCategory === 'general';

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.headerTitle}>Treatment Guidelines</Title>
        <Paragraph style={styles.headerSubtitle}>
          Comprehensive treatment protocols and guidelines
        </Paragraph>
      </Surface>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search guidelines..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.categoryChip}
            textStyle={styles.categoryChipText}
          >
            {category === 'all' ? 'All' : 
             category === 'general' ? 'General' :
             treatmentGuidelines[category]?.title || category}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {/* Disease-specific Guidelines */}
        {filteredGuidelines.map(([key, guideline]) => (
          <Card key={key} style={styles.guidelineCard}>
            <Card.Content>
              <View style={styles.guidelineHeader}>
                <MaterialCommunityIcons 
                  name={guideline.icon} 
                  size={24} 
                  color={guideline.color} 
                />
                <Title style={[styles.guidelineTitle, { color: guideline.color }]}>
                  {guideline.title}
                </Title>
              </View>
              
              <Paragraph style={styles.overview}>{guideline.overview}</Paragraph>

              <List.Section>
                <List.Accordion
                  title="Symptoms"
                  left={props => <List.Icon {...props} icon="format-list-bulleted" />}
                  expanded={expandedSections[`${key}-symptoms`]}
                  onPress={() => toggleSection(`${key}-symptoms`)}
                >
                  {guideline.symptoms.map((symptom, index) => (
                    <List.Item
                      key={index}
                      title={symptom}
                      left={props => <List.Icon {...props} icon="circle-small" />}
                    />
                  ))}
                </List.Accordion>

                <List.Accordion
                  title="Treatment"
                  left={props => <List.Icon {...props} icon="pill" />}
                  expanded={expandedSections[`${key}-treatment`]}
                  onPress={() => toggleSection(`${key}-treatment`)}
                >
                  <View style={styles.treatmentSection}>
                    <Paragraph style={styles.treatmentSubtitle}>First-line medications:</Paragraph>
                    {guideline.treatment.firstLine.map((med, index) => (
                      <Paragraph key={index} style={styles.medicationItem}>• {med}</Paragraph>
                    ))}
                    
                    <Paragraph style={styles.treatmentSubtitle}>Duration:</Paragraph>
                    <Paragraph style={styles.durationText}>{guideline.treatment.duration}</Paragraph>
                    
                    <Paragraph style={styles.treatmentSubtitle}>Monitoring:</Paragraph>
                    {guideline.treatment.monitoring.map((item, index) => (
                      <Paragraph key={index} style={styles.monitoringItem}>• {item}</Paragraph>
                    ))}
                  </View>
                </List.Accordion>

                <List.Accordion
                  title="Emergency Signals"
                  left={props => <List.Icon {...props} icon="alert" />}
                  expanded={expandedSections[`${key}-emergency`]}
                  onPress={() => toggleSection(`${key}-emergency`)}
                >
                  {guideline.emergencySignals.map((signal, index) => (
                    <List.Item
                      key={index}
                      title={signal}
                      left={props => <List.Icon {...props} icon="alert-circle" color="#E53E3E" />}
                      titleStyle={styles.emergencyText}
                    />
                  ))}
                </List.Accordion>
              </List.Section>
            </Card.Content>
          </Card>
        ))}

        {/* General Guidelines */}
        {showGeneral && (
          <Card style={styles.guidelineCard}>
            <Card.Content>
              <View style={styles.guidelineHeader}>
                <MaterialCommunityIcons name="book-medical" size={24} color="#2D3748" />
                <Title style={styles.guidelineTitle}>General Guidelines</Title>
              </View>
              
              <List.Section>
                {generalGuidelines.map((section, index) => (
                  <List.Accordion
                    key={index}
                    title={section.title}
                    left={props => <List.Icon {...props} icon={section.icon} />}
                    expanded={expandedSections[`general-${index}`]}
                    onPress={() => toggleSection(`general-${index}`)}
                  >
                    {section.content.map((item, itemIndex) => (
                      <List.Item
                        key={itemIndex}
                        title={item}
                        left={props => <List.Icon {...props} icon="circle-small" />}
                      />
                    ))}
                  </List.Accordion>
                ))}
              </List.Section>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#F7FAFC',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  categoryChip: {
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  guidelineCard: {
    marginBottom: 16,
    elevation: 2,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelineTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: 'bold',
  },
  overview: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 16,
    lineHeight: 24,
  },
  treatmentSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  treatmentSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 12,
    marginBottom: 8,
  },
  medicationItem: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
    paddingLeft: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
    marginBottom: 8,
  },
  monitoringItem: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
    paddingLeft: 8,
  },
  emergencyText: {
    color: '#E53E3E',
    fontWeight: '600',
  },
});
