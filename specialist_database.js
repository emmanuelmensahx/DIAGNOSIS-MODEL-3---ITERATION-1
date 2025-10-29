// Specialist Database Management System
// This file manages specialist data, availability status, and real-time updates

class SpecialistDatabase {
    constructor() {
        this.specialists = [];
        this.availabilityStatus = {};
        this.specializations = [];
        this.initializeDatabase();
        this.startRealTimeUpdates();
    }

    initializeDatabase() {
        // Load specialists from localStorage or initialize with default data
        const savedSpecialists = localStorage.getItem('specialists');
        if (savedSpecialists) {
            this.specialists = JSON.parse(savedSpecialists);
        } else {
            this.specialists = this.getDefaultSpecialists();
            this.saveSpecialists();
        }

        // Load availability status
        const savedAvailability = localStorage.getItem('specialistAvailability');
        if (savedAvailability) {
            this.availabilityStatus = JSON.parse(savedAvailability);
        } else {
            this.initializeAvailabilityStatus();
        }

        // Initialize specializations
        this.specializations = this.extractSpecializations();
    }

    getDefaultSpecialists() {
        return [
            // North Africa
            {
                id: 1,
                name: "Dr. Amina Hassan",
                specialization: "Internal Medicine",
                subSpecialties: ["Infectious Diseases", "Tropical Medicine", "Diabetes Management"],
                location: "Cairo, Egypt",
                country: "Egypt",
                timezone: "EET",
                avatar: "👩‍⚕️",
                email: "amina.hassan@hospital.eg",
                phone: "+20-2-2345-6789",
                languages: ["Arabic", "English", "French"],
                experience: 18,
                rating: 4.7,
                consultationFee: 40,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "16:00" },
                    tuesday: { start: "08:00", end: "16:00" },
                    wednesday: { start: "08:00", end: "16:00" },
                    thursday: { start: "08:00", end: "16:00" },
                    friday: { start: "08:00", end: "14:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Internal medicine specialist with extensive experience in infectious diseases and tropical medicine.",
                education: "MD from Cairo University, Fellowship in Infectious Diseases from CDC Atlanta",
                certifications: ["Board Certified Internal Medicine", "FIDSA", "DTM&H"]
            },
            {
                id: 2,
                name: "Dr. Omar Benali",
                specialization: "Cardiology",
                subSpecialties: ["Interventional Cardiology", "Heart Failure", "Arrhythmias"],
                location: "Casablanca, Morocco",
                country: "Morocco",
                timezone: "WET",
                avatar: "👨‍⚕️",
                email: "omar.benali@hospital.ma",
                phone: "+212-522-123456",
                languages: ["Arabic", "French", "English"],
                experience: 15,
                rating: 4.8,
                consultationFee: 45,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "15:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Experienced cardiologist specializing in interventional procedures and heart failure management.",
                education: "MD from Mohammed V University, Fellowship in Cardiology from Paris",
                certifications: ["Board Certified Cardiologist", "ESC Fellow", "FESC"]
            },
            {
                id: 3,
                name: "Dr. Fatima Kone",
                specialization: "Pediatrics",
                subSpecialties: ["Pediatric Emergency Medicine", "Neonatology", "Child Development"],
                location: "Tunis, Tunisia",
                country: "Tunisia",
                timezone: "CET",
                avatar: "👩‍⚕️",
                email: "fatima.kone@hospital.tn",
                phone: "+216-71-123456",
                languages: ["Arabic", "French", "English"],
                experience: 12,
                rating: 4.9,
                consultationFee: 35,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "16:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Pediatric specialist with expertise in emergency medicine and neonatal care.",
                education: "MD from University of Tunis, Pediatric Residency at Charles Nicolle Hospital",
                certifications: ["Board Certified Pediatrics", "PALS Instructor", "NRP Provider"]
            },
            {
                id: 4,
                name: "Dr. Ahmed Mansour",
                specialization: "Surgery",
                subSpecialties: ["General Surgery", "Trauma Surgery", "Laparoscopic Surgery"],
                location: "Tripoli, Libya",
                country: "Libya",
                timezone: "EET",
                avatar: "👨‍⚕️",
                email: "ahmed.mansour@hospital.ly",
                phone: "+218-21-123456",
                languages: ["Arabic", "English", "Italian"],
                experience: 20,
                rating: 4.6,
                consultationFee: 50,
                currency: "USD",
                workingHours: {
                    monday: { start: "07:00", end: "19:00" },
                    tuesday: { start: "07:00", end: "19:00" },
                    wednesday: { start: "07:00", end: "19:00" },
                    thursday: { start: "07:00", end: "19:00" },
                    friday: { start: "07:00", end: "17:00" },
                    saturday: { start: "08:00", end: "14:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Experienced surgeon specializing in trauma and emergency surgical procedures.",
                education: "MD from University of Tripoli, Surgery Residency at Tripoli Medical Center",
                certifications: ["Board Certified Surgery", "ATLS Instructor", "Laparoscopic Surgery Certified"]
            },
            {
                id: 5,
                name: "Dr. Mariam Abdel-Rahman",
                specialization: "Obstetrics & Gynecology",
                subSpecialties: ["Maternal-Fetal Medicine", "Reproductive Endocrinology", "Gynecologic Oncology"],
                location: "Khartoum, Sudan",
                country: "Sudan",
                timezone: "CAT",
                avatar: "👩‍⚕️",
                email: "mariam.abdel@hospital.sd",
                phone: "+249-183-123456",
                languages: ["Arabic", "English"],
                experience: 14,
                rating: 4.8,
                consultationFee: 30,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "15:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "OB/GYN specialist with expertise in high-risk pregnancies and reproductive health.",
                education: "MD from University of Khartoum, Fellowship in Maternal-Fetal Medicine",
                certifications: ["Board Certified OB/GYN", "MFM Fellowship", "FIGO Member"]
            },
            {
                id: 6,
                name: "Dr. Youssef Alaoui",
                specialization: "Neurology",
                subSpecialties: ["Stroke Medicine", "Epilepsy", "Movement Disorders"],
                location: "Algiers, Algeria",
                country: "Algeria",
                timezone: "CET",
                avatar: "👨‍⚕️",
                email: "youssef.alaoui@hospital.dz",
                phone: "+213-21-123456",
                languages: ["Arabic", "French", "English"],
                experience: 16,
                rating: 4.7,
                consultationFee: 40,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Neurologist specializing in stroke medicine and epilepsy management.",
                education: "MD from University of Algiers, Neurology Residency at Mustapha Hospital",
                certifications: ["Board Certified Neurologist", "Stroke Medicine Certified", "EEG Certified"]
            },

            // East Africa
            {
                id: 7,
                name: "Dr. Sarah Johnson",
                specialization: "Cardiology",
                subSpecialties: ["Interventional Cardiology", "Heart Failure", "Arrhythmias"],
                location: "Nairobi, Kenya",
                country: "Kenya",
                timezone: "EAT",
                avatar: "👩‍⚕️",
                email: "sarah.johnson@hospital.ke",
                phone: "+254-700-123456",
                languages: ["English", "Swahili"],
                experience: 15,
                rating: 4.8,
                consultationFee: 50,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Experienced cardiologist specializing in interventional procedures and heart failure management.",
                education: "MD from University of Nairobi, Fellowship in Cardiology from Johns Hopkins",
                certifications: ["Board Certified Cardiologist", "FACC", "FESC"]
            },
            {
                id: 8,
                name: "Dr. James Ochieng",
                specialization: "Surgery",
                subSpecialties: ["General Surgery", "Trauma Surgery", "Laparoscopic Surgery"],
                location: "Kampala, Uganda",
                country: "Uganda",
                timezone: "EAT",
                avatar: "👨‍⚕️",
                email: "james.ochieng@hospital.ug",
                phone: "+256-700-987654",
                languages: ["English", "Luganda", "Swahili"],
                experience: 20,
                rating: 4.6,
                consultationFee: 60,
                currency: "USD",
                workingHours: {
                    monday: { start: "07:00", end: "19:00" },
                    tuesday: { start: "07:00", end: "19:00" },
                    wednesday: { start: "07:00", end: "19:00" },
                    thursday: { start: "07:00", end: "19:00" },
                    friday: { start: "07:00", end: "17:00" },
                    saturday: { start: "08:00", end: "14:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Experienced surgeon specializing in trauma and emergency surgical procedures.",
                education: "MBChB from Makerere University, Surgery Residency at Mulago Hospital",
                certifications: ["FCS(ECSA)", "ATLS Instructor", "Laparoscopic Surgery Certified"]
            },
            {
                id: 9,
                name: "Dr. Mwangi Kariuki",
                specialization: "Internal Medicine",
                subSpecialties: ["Infectious Diseases", "HIV/AIDS", "Tuberculosis"],
                location: "Mombasa, Kenya",
                country: "Kenya",
                timezone: "EAT",
                avatar: "👨‍⚕️",
                email: "mwangi.kariuki@hospital.ke",
                phone: "+254-700-234567",
                languages: ["English", "Swahili", "Kikuyu"],
                experience: 18,
                rating: 4.7,
                consultationFee: 45,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Internal medicine specialist with expertise in infectious diseases and HIV/AIDS management.",
                education: "MBChB from University of Nairobi, Fellowship in Infectious Diseases",
                certifications: ["Board Certified Internal Medicine", "HIV Specialist", "TB Specialist"]
            },
            {
                id: 10,
                name: "Dr. Aisha Mwalimu",
                specialization: "Pediatrics",
                subSpecialties: ["Pediatric Infectious Diseases", "Malnutrition", "Child Development"],
                location: "Dar es Salaam, Tanzania",
                country: "Tanzania",
                timezone: "EAT",
                avatar: "👩‍⚕️",
                email: "aisha.mwalimu@hospital.tz",
                phone: "+255-22-123456",
                languages: ["English", "Swahili"],
                experience: 14,
                rating: 4.8,
                consultationFee: 40,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Pediatric specialist focusing on infectious diseases and malnutrition in children.",
                education: "MD from Muhimbili University, Pediatric Residency at Muhimbili Hospital",
                certifications: ["Board Certified Pediatrics", "Pediatric Infectious Disease Specialist"]
            },
            {
                id: 11,
                name: "Dr. Haile Gebremedhin",
                specialization: "Orthopedics",
                subSpecialties: ["Trauma Orthopedics", "Joint Replacement", "Sports Medicine"],
                location: "Addis Ababa, Ethiopia",
                country: "Ethiopia",
                timezone: "EAT",
                avatar: "👨‍⚕️",
                email: "haile.gebremedhin@hospital.et",
                phone: "+251-11-123456",
                languages: ["Amharic", "English"],
                experience: 16,
                rating: 4.6,
                consultationFee: 35,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Orthopedic surgeon specializing in trauma cases and joint replacement procedures.",
                education: "MD from Addis Ababa University, Orthopedic Residency at Black Lion Hospital",
                certifications: ["Board Certified Orthopedics", "Trauma Surgery Certified"]
            },
            {
                id: 12,
                name: "Dr. Grace Uwimana",
                specialization: "Obstetrics & Gynecology",
                subSpecialties: ["Maternal Health", "Family Planning", "Reproductive Health"],
                location: "Kigali, Rwanda",
                country: "Rwanda",
                timezone: "CAT",
                avatar: "👩‍⚕️",
                email: "grace.uwimana@hospital.rw",
                phone: "+250-788-123456",
                languages: ["Kinyarwanda", "English", "French"],
                experience: 12,
                rating: 4.9,
                consultationFee: 35,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "OB/GYN specialist focused on maternal health and family planning services.",
                education: "MD from University of Rwanda, OB/GYN Residency at University Teaching Hospital",
                certifications: ["Board Certified OB/GYN", "Family Planning Specialist"]
            },
            {
                id: 13,
                name: "Dr. Tekle Woldemichael",
                specialization: "Neurology",
                subSpecialties: ["Epilepsy", "Stroke Medicine", "Neurodegenerative Diseases"],
                location: "Mekelle, Ethiopia",
                country: "Ethiopia",
                timezone: "EAT",
                avatar: "👨‍⚕️",
                email: "tekle.woldemichael@hospital.et",
                phone: "+251-34-123456",
                languages: ["Tigrinya", "Amharic", "English"],
                experience: 19,
                rating: 4.7,
                consultationFee: 40,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Neurologist with expertise in epilepsy management and stroke care.",
                education: "MD from Mekelle University, Neurology Fellowship at Addis Ababa University",
                certifications: ["Board Certified Neurologist", "Epilepsy Specialist", "Stroke Certified"]
            },
            {
                id: 14,
                name: "Dr. Fatuma Ali",
                specialization: "Emergency Medicine",
                subSpecialties: ["Trauma Care", "Critical Care", "Emergency Pediatrics"],
                location: "Mogadishu, Somalia",
                country: "Somalia",
                timezone: "EAT",
                avatar: "👩‍⚕️",
                email: "fatuma.ali@hospital.so",
                phone: "+252-61-123456",
                languages: ["Somali", "Arabic", "English"],
                experience: 10,
                rating: 4.5,
                consultationFee: 25,
                currency: "USD",
                workingHours: {
                    monday: { start: "00:00", end: "23:59" },
                    tuesday: { start: "00:00", end: "23:59" },
                    wednesday: { start: "00:00", end: "23:59" },
                    thursday: { start: "00:00", end: "23:59" },
                    friday: { start: "00:00", end: "23:59" },
                    saturday: { start: "00:00", end: "23:59" },
                    sunday: { start: "00:00", end: "23:59" }
                },
                bio: "Emergency medicine specialist providing critical care in challenging environments.",
                education: "MD from Somali National University, Emergency Medicine Training",
                certifications: ["Emergency Medicine Certified", "ATLS Provider", "ACLS Provider"]
            },
            {
                id: 15,
                name: "Dr. Jean-Baptiste Niyonzima",
                specialization: "Psychiatry",
                subSpecialties: ["Trauma Psychiatry", "Child Psychiatry", "Community Mental Health"],
                location: "Bujumbura, Burundi",
                country: "Burundi",
                timezone: "CAT",
                avatar: "👨‍⚕️",
                email: "jean.niyonzima@hospital.bi",
                phone: "+257-22-123456",
                languages: ["Kirundi", "French", "English"],
                experience: 13,
                rating: 4.6,
                consultationFee: 30,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Psychiatrist specializing in trauma recovery and community mental health programs.",
                education: "MD from University of Burundi, Psychiatry Residency in Belgium",
                certifications: ["Board Certified Psychiatry", "Trauma Therapy Specialist"]
            },

            // West Africa
            {
                id: 16,
                name: "Dr. Adunni Adebayo",
                specialization: "Cardiology",
                subSpecialties: ["Interventional Cardiology", "Heart Failure", "Hypertension"],
                location: "Lagos, Nigeria",
                country: "Nigeria",
                timezone: "WAT",
                avatar: "👩‍⚕️",
                email: "adunni.adebayo@hospital.ng",
                phone: "+234-803-123456",
                languages: ["English", "Yoruba", "Hausa"],
                experience: 17,
                rating: 4.8,
                consultationFee: 55,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Leading cardiologist with expertise in interventional procedures and hypertension management.",
                education: "MBBS from University of Lagos, Cardiology Fellowship at University College Hospital",
                certifications: ["Board Certified Cardiologist", "FACC", "Interventional Cardiology Certified"]
            },
            {
                id: 17,
                name: "Dr. Kwame Asante",
                specialization: "Surgery",
                subSpecialties: ["Neurosurgery", "Spine Surgery", "Pediatric Neurosurgery"],
                location: "Accra, Ghana",
                country: "Ghana",
                timezone: "GMT",
                avatar: "👨‍⚕️",
                email: "kwame.asante@hospital.gh",
                phone: "+233-24-123456",
                languages: ["English", "Twi", "Ga"],
                experience: 22,
                rating: 4.9,
                consultationFee: 70,
                currency: "USD",
                workingHours: {
                    monday: { start: "07:00", end: "19:00" },
                    tuesday: { start: "07:00", end: "19:00" },
                    wednesday: { start: "07:00", end: "19:00" },
                    thursday: { start: "07:00", end: "19:00" },
                    friday: { start: "07:00", end: "17:00" },
                    saturday: { start: "08:00", end: "14:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Renowned neurosurgeon specializing in complex brain and spine surgeries.",
                education: "MBChB from University of Ghana, Neurosurgery Residency at Korle-Bu Teaching Hospital",
                certifications: ["Board Certified Neurosurgery", "Spine Surgery Specialist", "Pediatric Neurosurgery"]
            },
            {
                id: 18,
                name: "Dr. Aminata Diallo",
                specialization: "Pediatrics",
                subSpecialties: ["Pediatric Cardiology", "Congenital Heart Disease", "Pediatric ICU"],
                location: "Dakar, Senegal",
                country: "Senegal",
                timezone: "GMT",
                avatar: "👩‍⚕️",
                email: "aminata.diallo@hospital.sn",
                phone: "+221-33-123456",
                languages: ["French", "Wolof", "English"],
                experience: 15,
                rating: 4.7,
                consultationFee: 45,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Pediatric cardiologist specializing in congenital heart disease and pediatric intensive care.",
                education: "MD from Cheikh Anta Diop University, Pediatric Cardiology Fellowship in France",
                certifications: ["Board Certified Pediatrics", "Pediatric Cardiology Specialist", "PICU Certified"]
            },
            {
                id: 19,
                name: "Dr. Ibrahim Traore",
                specialization: "Internal Medicine",
                subSpecialties: ["Tropical Medicine", "Malaria", "Infectious Diseases"],
                location: "Bamako, Mali",
                country: "Mali",
                timezone: "GMT",
                avatar: "👨‍⚕️",
                email: "ibrahim.traore@hospital.ml",
                phone: "+223-20-123456",
                languages: ["French", "Bambara", "English"],
                experience: 16,
                rating: 4.6,
                consultationFee: 30,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "Internal medicine specialist with extensive experience in tropical diseases and malaria management.",
                education: "MD from University of Bamako, Tropical Medicine Fellowship",
                certifications: ["Board Certified Internal Medicine", "Tropical Medicine Specialist", "Malaria Expert"]
            },
            {
                id: 20,
                name: "Dr. Fatoumata Keita",
                specialization: "Obstetrics & Gynecology",
                subSpecialties: ["Maternal Health", "High-Risk Pregnancy", "Reproductive Health"],
                location: "Conakry, Guinea",
                country: "Guinea",
                timezone: "GMT",
                avatar: "👩‍⚕️",
                email: "fatoumata.keita@hospital.gn",
                phone: "+224-62-123456",
                languages: ["French", "Fulani", "Susu"],
                experience: 14,
                rating: 4.8,
                consultationFee: 35,
                currency: "USD",
                workingHours: {
                    monday: { start: "08:00", end: "17:00" },
                    tuesday: { start: "08:00", end: "17:00" },
                    wednesday: { start: "08:00", end: "17:00" },
                    thursday: { start: "08:00", end: "17:00" },
                    friday: { start: "08:00", end: "17:00" },
                    saturday: { start: "09:00", end: "13:00" },
                    sunday: { start: null, end: null }
                },
                bio: "OB/GYN specialist focused on maternal health and high-risk pregnancy management.",
                 education: "MD from Gamal Abdel Nasser University, OB/GYN Residency in France",
                 certifications: ["Board Certified OB/GYN", "Maternal-Fetal Medicine", "High-Risk Pregnancy Specialist"]
             },
             {
                 id: 21,
                 name: "Dr. Moussa Ouattara",
                 specialization: "Dermatology",
                 subSpecialties: ["Tropical Dermatology", "Skin Cancer", "Pediatric Dermatology"],
                 location: "Abidjan, Ivory Coast",
                 country: "Ivory Coast",
                 timezone: "GMT",
                 avatar: "👨‍⚕️",
                 email: "moussa.ouattara@hospital.ci",
                 phone: "+225-20-123456",
                 languages: ["French", "Dioula", "English"],
                 experience: 11,
                 rating: 4.6,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Dermatologist specializing in tropical skin diseases and pediatric dermatology.",
                 education: "MD from Félix Houphouët-Boigny University, Dermatology Residency in France",
                 certifications: ["Board Certified Dermatology", "Tropical Dermatology Specialist"]
             },
             {
                 id: 22,
                 name: "Dr. Mariama Bah",
                 specialization: "Ophthalmology",
                 subSpecialties: ["Cataract Surgery", "Glaucoma", "Retinal Diseases"],
                 location: "Freetown, Sierra Leone",
                 country: "Sierra Leone",
                 timezone: "GMT",
                 avatar: "👩‍⚕️",
                 email: "mariama.bah@hospital.sl",
                 phone: "+232-22-123456",
                 languages: ["English", "Krio", "Temne"],
                 experience: 13,
                 rating: 4.7,
                 consultationFee: 35,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Ophthalmologist specializing in cataract surgery and glaucoma management.",
                 education: "MBBS from University of Sierra Leone, Ophthalmology Fellowship in UK",
                 certifications: ["Board Certified Ophthalmology", "Cataract Surgery Specialist"]
             },
             {
                 id: 23,
                 name: "Dr. Alpha Conde",
                 specialization: "Urology",
                 subSpecialties: ["Prostate Surgery", "Kidney Stones", "Male Infertility"],
                 location: "Monrovia, Liberia",
                 country: "Liberia",
                 timezone: "GMT",
                 avatar: "👨‍⚕️",
                 email: "alpha.conde@hospital.lr",
                 phone: "+231-77-123456",
                 languages: ["English", "Kpelle", "Bassa"],
                 experience: 18,
                 rating: 4.5,
                 consultationFee: 45,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Urologist with expertise in prostate surgery and kidney stone management.",
                 education: "MD from University of Liberia, Urology Residency in Ghana",
                 certifications: ["Board Certified Urology", "Laparoscopic Surgery Certified"]
             },
             {
                 id: 24,
                 name: "Dr. Khadija Sankara",
                 specialization: "Endocrinology",
                 subSpecialties: ["Diabetes", "Thyroid Disorders", "Metabolic Syndrome"],
                 location: "Ouagadougou, Burkina Faso",
                 country: "Burkina Faso",
                 timezone: "GMT",
                 avatar: "👩‍⚕️",
                 email: "khadija.sankara@hospital.bf",
                 phone: "+226-25-123456",
                 languages: ["French", "Mooré", "Dioula"],
                 experience: 15,
                 rating: 4.8,
                 consultationFee: 35,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Endocrinologist specializing in diabetes management and thyroid disorders.",
                 education: "MD from University of Ouagadougou, Endocrinology Fellowship in France",
                 certifications: ["Board Certified Endocrinology", "Diabetes Specialist"]
             },
             {
                 id: 25,
                 name: "Dr. Sekou Toure",
                 specialization: "Gastroenterology",
                 subSpecialties: ["Hepatology", "Inflammatory Bowel Disease", "Endoscopy"],
                 location: "Niamey, Niger",
                 country: "Niger",
                 timezone: "WAT",
                 avatar: "👨‍⚕️",
                 email: "sekou.toure@hospital.ne",
                 phone: "+227-20-123456",
                 languages: ["French", "Hausa", "Zarma"],
                 experience: 17,
                 rating: 4.6,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Gastroenterologist with expertise in liver diseases and endoscopic procedures.",
                 education: "MD from Abdou Moumouni University, Gastroenterology Fellowship in Morocco",
                 certifications: ["Board Certified Gastroenterology", "Endoscopy Specialist"]
             },

             // Central Africa
             {
                 id: 26,
                 name: "Dr. Pauline Mbeki",
                 specialization: "Cardiology",
                 subSpecialties: ["Interventional Cardiology", "Heart Failure", "Cardiac Rehabilitation"],
                 location: "Kinshasa, Democratic Republic of Congo",
                 country: "Democratic Republic of Congo",
                 timezone: "WAT",
                 avatar: "👩‍⚕️",
                 email: "pauline.mbeki@hospital.cd",
                 phone: "+243-81-123456",
                 languages: ["French", "Lingala", "Kikongo"],
                 experience: 19,
                 rating: 4.7,
                 consultationFee: 45,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Cardiologist specializing in interventional procedures and cardiac rehabilitation.",
                 education: "MD from University of Kinshasa, Cardiology Fellowship in Belgium",
                 certifications: ["Board Certified Cardiology", "Interventional Cardiology Certified"]
             },
             {
                 id: 27,
                 name: "Dr. Jean-Claude Moukoko",
                 specialization: "Surgery",
                 subSpecialties: ["Cardiac Surgery", "Thoracic Surgery", "Vascular Surgery"],
                 location: "Yaoundé, Cameroon",
                 country: "Cameroon",
                 timezone: "WAT",
                 avatar: "👨‍⚕️",
                 email: "jean.moukoko@hospital.cm",
                 phone: "+237-22-123456",
                 languages: ["French", "English", "Ewondo"],
                 experience: 24,
                 rating: 4.9,
                 consultationFee: 80,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "07:00", end: "19:00" },
                     tuesday: { start: "07:00", end: "19:00" },
                     wednesday: { start: "07:00", end: "19:00" },
                     thursday: { start: "07:00", end: "19:00" },
                     friday: { start: "07:00", end: "17:00" },
                     saturday: { start: "08:00", end: "14:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Cardiac surgeon with expertise in complex heart and thoracic procedures.",
                 education: "MD from University of Yaoundé, Cardiac Surgery Fellowship in France",
                 certifications: ["Board Certified Cardiac Surgery", "Thoracic Surgery Specialist"]
             },
             {
                 id: 28,
                 name: "Dr. Marie-Claire Nguema",
                 specialization: "Pediatrics",
                 subSpecialties: ["Pediatric Oncology", "Hematology", "Palliative Care"],
                 location: "Libreville, Gabon",
                 country: "Gabon",
                 timezone: "WAT",
                 avatar: "👩‍⚕️",
                 email: "marie.nguema@hospital.ga",
                 phone: "+241-01-123456",
                 languages: ["French", "Fang", "English"],
                 experience: 16,
                 rating: 4.8,
                 consultationFee: 55,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Pediatric oncologist specializing in childhood cancers and hematological disorders.",
                 education: "MD from Omar Bongo University, Pediatric Oncology Fellowship in France",
                 certifications: ["Board Certified Pediatrics", "Pediatric Oncology Specialist"]
             },
             {
                 id: 29,
                 name: "Dr. Théophile Okoye",
                 specialization: "Internal Medicine",
                 subSpecialties: ["Rheumatology", "Autoimmune Diseases", "Pain Management"],
                 location: "Bangui, Central African Republic",
                 country: "Central African Republic",
                 timezone: "WAT",
                 avatar: "👨‍⚕️",
                 email: "theophile.okoye@hospital.cf",
                 phone: "+236-75-123456",
                 languages: ["French", "Sango", "English"],
                 experience: 14,
                 rating: 4.5,
                 consultationFee: 30,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Internal medicine specialist with expertise in rheumatology and autoimmune diseases.",
                 education: "MD from University of Bangui, Rheumatology Fellowship in France",
                 certifications: ["Board Certified Internal Medicine", "Rheumatology Specialist"]
             },
             {
                 id: 30,
                 name: "Dr. Esperance Nzeyimana",
                 specialization: "Obstetrics & Gynecology",
                 subSpecialties: ["Maternal Health", "Gynecologic Surgery", "Reproductive Endocrinology"],
                 location: "Brazzaville, Republic of Congo",
                 country: "Republic of Congo",
                 timezone: "WAT",
                 avatar: "👩‍⚕️",
                 email: "esperance.nzeyimana@hospital.cg",
                 phone: "+242-05-123456",
                 languages: ["French", "Lingala", "Kikongo"],
                 experience: 17,
                 rating: 4.7,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "OB/GYN specialist with expertise in maternal health and gynecologic surgery.",
                 education: "MD from Marien Ngouabi University, OB/GYN Residency in France",
                 certifications: ["Board Certified OB/GYN", "Gynecologic Surgery Specialist"]
             },
             {
                 id: 31,
                 name: "Dr. Rodrigue Obiang",
                 specialization: "Neurology",
                 subSpecialties: ["Movement Disorders", "Epilepsy", "Neuromuscular Diseases"],
                 location: "Malabo, Equatorial Guinea",
                 country: "Equatorial Guinea",
                 timezone: "WAT",
                 avatar: "👨‍⚕️",
                 email: "rodrigue.obiang@hospital.gq",
                 phone: "+240-333-123456",
                 languages: ["Spanish", "French", "Fang"],
                 experience: 15,
                 rating: 4.6,
                 consultationFee: 50,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Neurologist specializing in movement disorders and epilepsy management.",
                 education: "MD from National University of Equatorial Guinea, Neurology Fellowship in Spain",
                 certifications: ["Board Certified Neurology", "Movement Disorders Specialist"]
             },
             {
                 id: 32,
                 name: "Dr. Celestine Ndong",
                 specialization: "Emergency Medicine",
                 subSpecialties: ["Trauma Care", "Emergency Surgery", "Critical Care"],
                 location: "N'Djamena, Chad",
                 country: "Chad",
                 timezone: "WAT",
                 avatar: "👩‍⚕️",
                 email: "celestine.ndong@hospital.td",
                 phone: "+235-66-123456",
                 languages: ["French", "Arabic", "Sara"],
                 experience: 12,
                 rating: 4.4,
                 consultationFee: 35,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "00:00", end: "23:59" },
                     tuesday: { start: "00:00", end: "23:59" },
                     wednesday: { start: "00:00", end: "23:59" },
                     thursday: { start: "00:00", end: "23:59" },
                     friday: { start: "00:00", end: "23:59" },
                     saturday: { start: "00:00", end: "23:59" },
                     sunday: { start: "00:00", end: "23:59" }
                 },
                 bio: "Emergency medicine specialist providing critical care in challenging environments.",
                 education: "MD from University of N'Djamena, Emergency Medicine Training in France",
                 certifications: ["Emergency Medicine Certified", "Trauma Surgery Certified"]
             },

             // Southern Africa
             {
                 id: 33,
                 name: "Dr. Nomsa Mthembu",
                 specialization: "Cardiology",
                 subSpecialties: ["Interventional Cardiology", "Heart Failure", "Preventive Cardiology"],
                 location: "Johannesburg, South Africa",
                 country: "South Africa",
                 timezone: "SAST",
                 avatar: "👩‍⚕️",
                 email: "nomsa.mthembu@hospital.za",
                 phone: "+27-11-123456",
                 languages: ["English", "Zulu", "Afrikaans"],
                 experience: 20,
                 rating: 4.9,
                 consultationFee: 75,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Leading cardiologist with expertise in interventional procedures and preventive cardiology.",
                 education: "MBChB from University of Cape Town, Cardiology Fellowship at Groote Schuur Hospital",
                 certifications: ["Board Certified Cardiology", "Interventional Cardiology Certified", "FACC"]
             },
             {
                 id: 34,
                 name: "Dr. Thabo Molefe",
                 specialization: "Surgery",
                 subSpecialties: ["Transplant Surgery", "Hepatobiliary Surgery", "Minimally Invasive Surgery"],
                 location: "Cape Town, South Africa",
                 country: "South Africa",
                 timezone: "SAST",
                 avatar: "👨‍⚕️",
                 email: "thabo.molefe@hospital.za",
                 phone: "+27-21-123456",
                 languages: ["English", "Afrikaans", "Xhosa"],
                 experience: 25,
                 rating: 4.9,
                 consultationFee: 90,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "07:00", end: "19:00" },
                     tuesday: { start: "07:00", end: "19:00" },
                     wednesday: { start: "07:00", end: "19:00" },
                     thursday: { start: "07:00", end: "19:00" },
                     friday: { start: "07:00", end: "17:00" },
                     saturday: { start: "08:00", end: "14:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Transplant surgeon specializing in liver and kidney transplantation.",
                 education: "MBChB from University of the Witwatersrand, Transplant Surgery Fellowship in USA",
                 certifications: ["Board Certified Surgery", "Transplant Surgery Specialist", "Hepatobiliary Surgery"]
             },
             {
                 id: 35,
                 name: "Dr. Chipo Mukamuri",
                 specialization: "Pediatrics",
                 subSpecialties: ["Pediatric HIV/AIDS", "Malnutrition", "Child Development"],
                 location: "Harare, Zimbabwe",
                 country: "Zimbabwe",
                 timezone: "CAT",
                 avatar: "👩‍⚕️",
                 email: "chipo.mukamuri@hospital.zw",
                 phone: "+263-4-123456",
                 languages: ["English", "Shona", "Ndebele"],
                 experience: 16,
                 rating: 4.7,
                 consultationFee: 35,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Pediatric specialist with expertise in HIV/AIDS management and child development.",
                 education: "MBChB from University of Zimbabwe, Pediatric HIV Fellowship",
                 certifications: ["Board Certified Pediatrics", "Pediatric HIV Specialist"]
             },
             {
                 id: 36,
                 name: "Dr. Seabelo Motsepe",
                 specialization: "Internal Medicine",
                 subSpecialties: ["Infectious Diseases", "HIV/AIDS", "Tuberculosis"],
                 location: "Gaborone, Botswana",
                 country: "Botswana",
                 timezone: "CAT",
                 avatar: "👨‍⚕️",
                 email: "seabelo.motsepe@hospital.bw",
                 phone: "+267-3-123456",
                 languages: ["English", "Setswana"],
                 experience: 18,
                 rating: 4.8,
                 consultationFee: 45,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Internal medicine specialist with extensive experience in HIV/AIDS and TB management.",
                 education: "MBChB from University of Botswana, Infectious Diseases Fellowship in South Africa",
                 certifications: ["Board Certified Internal Medicine", "HIV Specialist", "TB Specialist"]
             },
             {
                 id: 37,
                 name: "Dr. Nalaka Ramadhani",
                 specialization: "Obstetrics & Gynecology",
                 subSpecialties: ["Maternal Health", "High-Risk Pregnancy", "Reproductive Health"],
                 location: "Lusaka, Zambia",
                 country: "Zambia",
                 timezone: "CAT",
                 avatar: "👩‍⚕️",
                 email: "nalaka.ramadhani@hospital.zm",
                 phone: "+260-21-123456",
                 languages: ["English", "Bemba", "Nyanja"],
                 experience: 15,
                 rating: 4.6,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "OB/GYN specialist focused on maternal health and high-risk pregnancy management.",
                 education: "MBChB from University of Zambia, OB/GYN Residency at University Teaching Hospital",
                 certifications: ["Board Certified OB/GYN", "Maternal Health Specialist"]
             },
             {
                 id: 38,
                 name: "Dr. Tarisai Chigumira",
                 specialization: "Neurology",
                 subSpecialties: ["Stroke Medicine", "Epilepsy", "Headache Disorders"],
                 location: "Windhoek, Namibia",
                 country: "Namibia",
                 timezone: "CAT",
                 avatar: "👨‍⚕️",
                 email: "tarisai.chigumira@hospital.na",
                 phone: "+264-61-123456",
                 languages: ["English", "Afrikaans", "Oshiwambo"],
                 experience: 17,
                 rating: 4.7,
                 consultationFee: 50,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Neurologist specializing in stroke medicine and epilepsy management.",
                 education: "MBChB from University of Namibia, Neurology Fellowship in South Africa",
                 certifications: ["Board Certified Neurology", "Stroke Medicine Certified"]
             },
             {
                 id: 39,
                 name: "Dr. Limakatso Mokhele",
                 specialization: "Emergency Medicine",
                 subSpecialties: ["Trauma Care", "Emergency Surgery", "Disaster Medicine"],
                 location: "Maseru, Lesotho",
                 country: "Lesotho",
                 timezone: "SAST",
                 avatar: "👩‍⚕️",
                 email: "limakatso.mokhele@hospital.ls",
                 phone: "+266-22-123456",
                 languages: ["English", "Sesotho"],
                 experience: 13,
                 rating: 4.5,
                 consultationFee: 35,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "00:00", end: "23:59" },
                     tuesday: { start: "00:00", end: "23:59" },
                     wednesday: { start: "00:00", end: "23:59" },
                     thursday: { start: "00:00", end: "23:59" },
                     friday: { start: "00:00", end: "23:59" },
                     saturday: { start: "00:00", end: "23:59" },
                     sunday: { start: "00:00", end: "23:59" }
                 },
                 bio: "Emergency medicine specialist with expertise in trauma care and disaster medicine.",
                 education: "MBChB from National University of Lesotho, Emergency Medicine Training in South Africa",
                 certifications: ["Emergency Medicine Certified", "Trauma Care Specialist"]
             },
             {
                 id: 40,
                 name: "Dr. Sipho Dlamini",
                 specialization: "Psychiatry",
                 subSpecialties: ["Child Psychiatry", "Substance Abuse", "Community Mental Health"],
                 location: "Mbabane, Eswatini",
                 country: "Eswatini",
                 timezone: "SAST",
                 avatar: "👨‍⚕️",
                 email: "sipho.dlamini@hospital.sz",
                 phone: "+268-24-123456",
                 languages: ["English", "SiSwati"],
                 experience: 14,
                 rating: 4.6,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Psychiatrist specializing in child mental health and substance abuse treatment.",
                 education: "MBChB from University of Eswatini, Psychiatry Residency in South Africa",
                 certifications: ["Board Certified Psychiatry", "Child Psychiatry Specialist"]
             },

             // Island Nations
             {
                 id: 41,
                 name: "Dr. Hery Rajaonary",
                 specialization: "Tropical Medicine",
                 subSpecialties: ["Malaria", "Dengue Fever", "Parasitic Diseases"],
                 location: "Antananarivo, Madagascar",
                 country: "Madagascar",
                 timezone: "EAT",
                 avatar: "👨‍⚕️",
                 email: "hery.rajaonary@hospital.mg",
                 phone: "+261-20-123456",
                 languages: ["Malagasy", "French", "English"],
                 experience: 19,
                 rating: 4.8,
                 consultationFee: 35,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Tropical medicine specialist with expertise in malaria and parasitic diseases.",
                 education: "MD from University of Antananarivo, Tropical Medicine Fellowship in France",
                 certifications: ["Tropical Medicine Specialist", "Malaria Expert", "Parasitology Certified"]
             },
             {
                 id: 42,
                 name: "Dr. Nirina Andriamampianina",
                 specialization: "Pediatrics",
                 subSpecialties: ["Pediatric Surgery", "Neonatology", "Pediatric Intensive Care"],
                 location: "Toamasina, Madagascar",
                 country: "Madagascar",
                 timezone: "EAT",
                 avatar: "👩‍⚕️",
                 email: "nirina.andriamampianina@hospital.mg",
                 phone: "+261-53-123456",
                 languages: ["Malagasy", "French", "English"],
                 experience: 16,
                 rating: 4.7,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Pediatric surgeon specializing in neonatal surgery and pediatric intensive care.",
                 education: "MD from University of Antananarivo, Pediatric Surgery Fellowship in France",
                 certifications: ["Board Certified Pediatrics", "Pediatric Surgery Specialist", "PICU Certified"]
             },
             {
                 id: 43,
                 name: "Dr. Antonio Silva",
                 specialization: "Internal Medicine",
                 subSpecialties: ["Infectious Diseases", "Tropical Medicine", "Public Health"],
                 location: "Praia, Cape Verde",
                 country: "Cape Verde",
                 timezone: "CVT",
                 avatar: "👨‍⚕️",
                 email: "antonio.silva@hospital.cv",
                 phone: "+238-260-123456",
                 languages: ["Portuguese", "Cape Verdean Creole", "French"],
                 experience: 15,
                 rating: 4.6,
                 consultationFee: 45,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Internal medicine specialist with expertise in infectious diseases and public health.",
                 education: "MD from University of Cape Verde, Infectious Diseases Fellowship in Portugal",
                 certifications: ["Board Certified Internal Medicine", "Infectious Diseases Specialist"]
             },
             {
                 id: 44,
                 name: "Dr. Maria dos Santos",
                 specialization: "Obstetrics & Gynecology",
                 subSpecialties: ["Maternal Health", "Family Planning", "Gynecologic Oncology"],
                 location: "São Tomé, São Tomé and Príncipe",
                 country: "São Tomé and Príncipe",
                 timezone: "GMT",
                 avatar: "👩‍⚕️",
                 email: "maria.santos@hospital.st",
                 phone: "+239-22-123456",
                 languages: ["Portuguese", "French", "English"],
                 experience: 13,
                 rating: 4.7,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "OB/GYN specialist focused on maternal health and family planning services.",
                 education: "MD from University of São Tomé and Príncipe, OB/GYN Residency in Portugal",
                 certifications: ["Board Certified OB/GYN", "Family Planning Specialist"]
             },
             {
                 id: 45,
                 name: "Dr. Jean-Paul Morel",
                 specialization: "Surgery",
                 subSpecialties: ["General Surgery", "Trauma Surgery", "Emergency Surgery"],
                 location: "Port Louis, Mauritius",
                 country: "Mauritius",
                 timezone: "MUT",
                 avatar: "👨‍⚕️",
                 email: "jean.morel@hospital.mu",
                 phone: "+230-212-123456",
                 languages: ["French", "English", "Mauritian Creole"],
                 experience: 21,
                 rating: 4.8,
                 consultationFee: 60,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "07:00", end: "19:00" },
                     tuesday: { start: "07:00", end: "19:00" },
                     wednesday: { start: "07:00", end: "19:00" },
                     thursday: { start: "07:00", end: "19:00" },
                     friday: { start: "07:00", end: "17:00" },
                     saturday: { start: "08:00", end: "14:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "General surgeon with expertise in trauma and emergency surgical procedures.",
                 education: "MD from University of Mauritius, Surgery Residency in France",
                 certifications: ["Board Certified Surgery", "Trauma Surgery Specialist"]
             },
             {
                 id: 46,
                 name: "Dr. Priya Ramgoolam",
                 specialization: "Cardiology",
                 subSpecialties: ["Interventional Cardiology", "Echocardiography", "Cardiac Rehabilitation"],
                 location: "Victoria, Seychelles",
                 country: "Seychelles",
                 timezone: "SCT",
                 avatar: "👩‍⚕️",
                 email: "priya.ramgoolam@hospital.sc",
                 phone: "+248-4-123456",
                 languages: ["English", "French", "Seychellois Creole"],
                 experience: 14,
                 rating: 4.7,
                 consultationFee: 65,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Cardiologist specializing in interventional procedures and cardiac rehabilitation.",
                 education: "MBBS from University of Seychelles, Cardiology Fellowship in UK",
                 certifications: ["Board Certified Cardiology", "Interventional Cardiology Certified"]
             },
             {
                 id: 47,
                 name: "Dr. Ahmed Al-Qadri",
                 specialization: "Neurology",
                 subSpecialties: ["Stroke Medicine", "Epilepsy", "Neurointensive Care"],
                 location: "Moroni, Comoros",
                 country: "Comoros",
                 timezone: "EAT",
                 avatar: "👨‍⚕️",
                 email: "ahmed.alqadri@hospital.km",
                 phone: "+269-73-123456",
                 languages: ["Arabic", "French", "Comorian"],
                 experience: 16,
                 rating: 4.6,
                 consultationFee: 40,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Neurologist specializing in stroke medicine and neurointensive care.",
                 education: "MD from University of Comoros, Neurology Fellowship in France",
                 certifications: ["Board Certified Neurology", "Stroke Medicine Certified"]
             },

             // Additional specialists to reach 100
             {
                 id: 48,
                 name: "Dr. Kofi Mensah",
                 specialization: "Oncology",
                 subSpecialties: ["Medical Oncology", "Hematology", "Palliative Care"],
                 location: "Kumasi, Ghana",
                 country: "Ghana",
                 timezone: "GMT",
                 avatar: "👨‍⚕️",
                 email: "kofi.mensah@hospital.gh",
                 phone: "+233-32-123456",
                 languages: ["English", "Twi", "Akan"],
                 experience: 18,
                 rating: 4.8,
                 consultationFee: 60,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Medical oncologist specializing in cancer treatment and palliative care.",
                 education: "MBChB from Kwame Nkrumah University, Oncology Fellowship in UK",
                 certifications: ["Board Certified Oncology", "Hematology Specialist", "Palliative Care Certified"]
             },
             {
                 id: 49,
                 name: "Dr. Folake Adeyemi",
                 specialization: "Radiology",
                 subSpecialties: ["Interventional Radiology", "Diagnostic Imaging", "Mammography"],
                 location: "Abuja, Nigeria",
                 country: "Nigeria",
                 timezone: "WAT",
                 avatar: "👩‍⚕️",
                 email: "folake.adeyemi@hospital.ng",
                 phone: "+234-9-123456",
                 languages: ["English", "Yoruba", "Igbo"],
                 experience: 15,
                 rating: 4.7,
                 consultationFee: 50,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "08:00", end: "17:00" },
                     tuesday: { start: "08:00", end: "17:00" },
                     wednesday: { start: "08:00", end: "17:00" },
                     thursday: { start: "08:00", end: "17:00" },
                     friday: { start: "08:00", end: "17:00" },
                     saturday: { start: "09:00", end: "13:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Radiologist specializing in interventional procedures and diagnostic imaging.",
                 education: "MBBS from University of Ibadan, Radiology Residency at University College Hospital",
                 certifications: ["Board Certified Radiology", "Interventional Radiology Certified"]
             },
             {
                 id: 50,
                 name: "Dr. Chinedu Okwu",
                 specialization: "Anesthesiology",
                 subSpecialties: ["Cardiac Anesthesia", "Pain Management", "Critical Care"],
                 location: "Port Harcourt, Nigeria",
                 country: "Nigeria",
                 timezone: "WAT",
                 avatar: "👨‍⚕️",
                 email: "chinedu.okwu@hospital.ng",
                 phone: "+234-84-123456",
                 languages: ["English", "Igbo", "Hausa"],
                 experience: 17,
                 rating: 4.6,
                 consultationFee: 45,
                 currency: "USD",
                 workingHours: {
                     monday: { start: "07:00", end: "19:00" },
                     tuesday: { start: "07:00", end: "19:00" },
                     wednesday: { start: "07:00", end: "19:00" },
                     thursday: { start: "07:00", end: "19:00" },
                     friday: { start: "07:00", end: "17:00" },
                     saturday: { start: "08:00", end: "14:00" },
                     sunday: { start: null, end: null }
                 },
                 bio: "Anesthesiologist specializing in cardiac anesthesia and pain management.",
                 education: "MBBS from University of Nigeria, Anesthesiology Residency at University of Port Harcourt",
                 certifications: ["Board Certified Anesthesiology", "Cardiac Anesthesia Specialist", "Pain Management"]
             }
         ];
    }

    initializeAvailabilityStatus() {
        this.specialists.forEach(specialist => {
            this.availabilityStatus[specialist.id] = {
                status: this.getRandomStatus(),
                lastUpdated: new Date().toISOString(),
                currentConsultations: Math.floor(Math.random() * 3),
                maxConsultations: 5,
                nextAvailable: this.calculateNextAvailable(specialist),
                isOnline: Math.random() > 0.3 // 70% chance of being online
            };
        });
        this.saveAvailabilityStatus();
    }

    getRandomStatus() {
        const statuses = ['available', 'busy', 'partially-available'];
        const weights = [0.4, 0.3, 0.3]; // 40% available, 30% busy, 30% partially available
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < statuses.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return statuses[i];
            }
        }
        return 'available';
    }

    calculateNextAvailable(specialist) {
        const now = new Date();
        const today = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
        const workingHours = specialist.workingHours[today];
        
        if (!workingHours || !workingHours.start) {
            // Find next working day
            const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            let nextDay = (now.getDay() + 1) % 7;
            
            for (let i = 0; i < 7; i++) {
                const dayName = daysOfWeek[nextDay];
                if (specialist.workingHours[dayName] && specialist.workingHours[dayName].start) {
                    const nextDate = new Date(now);
                    nextDate.setDate(now.getDate() + i + 1);
                    nextDate.setHours(parseInt(specialist.workingHours[dayName].start.split(':')[0]));
                    nextDate.setMinutes(parseInt(specialist.workingHours[dayName].start.split(':')[1]));
                    return nextDate.toISOString();
                }
                nextDay = (nextDay + 1) % 7;
            }
        }
        
        // Add random minutes to current time for next availability
        const nextAvailable = new Date(now.getTime() + Math.random() * 120 * 60000); // 0-120 minutes
        return nextAvailable.toISOString();
    }

    extractSpecializations() {
        const specializations = [...new Set(this.specialists.map(s => s.specialization))];
        return specializations.sort();
    }

    // Public methods for accessing specialist data
    getAllSpecialists() {
        return this.specialists.map(specialist => ({
            ...specialist,
            availability: this.availabilityStatus[specialist.id]
        }));
    }

    getSpecialistById(id) {
        const specialist = this.specialists.find(s => s.id === parseInt(id));
        if (specialist) {
            return {
                ...specialist,
                availability: this.availabilityStatus[specialist.id]
            };
        }
        return null;
    }

    getSpecialistsBySpecialization(specialization) {
        return this.specialists
            .filter(s => s.specialization === specialization)
            .map(specialist => ({
                ...specialist,
                availability: this.availabilityStatus[specialist.id]
            }));
    }

    getAvailableSpecialists() {
        return this.specialists
            .filter(s => this.availabilityStatus[s.id]?.status === 'available')
            .map(specialist => ({
                ...specialist,
                availability: this.availabilityStatus[specialist.id]
            }));
    }

    getSpecializations() {
        return this.specializations;
    }

    updateAvailabilityStatus(specialistId, status, additionalData = {}) {
        if (this.availabilityStatus[specialistId]) {
            this.availabilityStatus[specialistId] = {
                ...this.availabilityStatus[specialistId],
                status: status,
                lastUpdated: new Date().toISOString(),
                ...additionalData
            };
            this.saveAvailabilityStatus();
            this.notifyAvailabilityChange(specialistId, status);
        }
    }

    searchSpecialists(query) {
        const searchTerm = query.toLowerCase();
        return this.specialists
            .filter(specialist => 
                specialist.name.toLowerCase().includes(searchTerm) ||
                specialist.specialization.toLowerCase().includes(searchTerm) ||
                specialist.subSpecialties.some(sub => sub.toLowerCase().includes(searchTerm)) ||
                specialist.location.toLowerCase().includes(searchTerm) ||
                specialist.languages.some(lang => lang.toLowerCase().includes(searchTerm))
            )
            .map(specialist => ({
                ...specialist,
                availability: this.availabilityStatus[specialist.id]
            }));
    }

    // Intelligent specialist recommendation based on diagnosis and symptoms
    recommendSpecialists(diagnosis, symptoms = [], patientAge = null) {
        const recommendations = [];
        
        // Define diagnosis-to-specialist mapping
        const diagnosisMapping = {
            // Cardiovascular conditions
            'heart': ['Cardiology'],
            'cardiac': ['Cardiology'],
            'chest pain': ['Cardiology', 'Emergency Medicine'],
            'hypertension': ['Cardiology', 'Internal Medicine'],
            'arrhythmia': ['Cardiology'],
            'myocardial': ['Cardiology'],
            
            // Neurological conditions
            'stroke': ['Neurology', 'Emergency Medicine'],
            'seizure': ['Neurology'],
            'headache': ['Neurology', 'Internal Medicine'],
            'migraine': ['Neurology'],
            'epilepsy': ['Neurology'],
            'paralysis': ['Neurology'],
            'neurological': ['Neurology'],
            
            // Respiratory conditions
            'pneumonia': ['Pulmonology', 'Internal Medicine'],
            'asthma': ['Pulmonology', 'Internal Medicine'],
            'respiratory': ['Pulmonology'],
            'lung': ['Pulmonology'],
            'breathing': ['Pulmonology', 'Emergency Medicine'],
            'cough': ['Pulmonology', 'Internal Medicine'],
            
            // Gastrointestinal conditions
            'abdominal': ['Gastroenterology', 'Surgery'],
            'stomach': ['Gastroenterology', 'Internal Medicine'],
            'diarrhea': ['Gastroenterology', 'Internal Medicine'],
            'vomiting': ['Gastroenterology', 'Internal Medicine'],
            'nausea': ['Gastroenterology', 'Internal Medicine'],
            'appendicitis': ['Surgery', 'Emergency Medicine'],
            
            // Pediatric conditions
            'child': ['Pediatrics'],
            'infant': ['Pediatrics'],
            'pediatric': ['Pediatrics'],
            
            // Infectious diseases
            'fever': ['Internal Medicine', 'Infectious Diseases'],
            'infection': ['Infectious Diseases', 'Internal Medicine'],
            'malaria': ['Infectious Diseases', 'Internal Medicine'],
            'tuberculosis': ['Infectious Diseases', 'Pulmonology'],
            'sepsis': ['Infectious Diseases', 'Emergency Medicine'],
            
            // Surgical conditions
            'fracture': ['Orthopedics', 'Surgery'],
            'trauma': ['Surgery', 'Emergency Medicine'],
            'wound': ['Surgery', 'Emergency Medicine'],
            'bleeding': ['Surgery', 'Emergency Medicine'],
            
            // Obstetric/Gynecologic
            'pregnancy': ['Obstetrics & Gynecology'],
            'pregnant': ['Obstetrics & Gynecology'],
            'gynecological': ['Obstetrics & Gynecology'],
            'menstrual': ['Obstetrics & Gynecology'],
            
            // Emergency conditions
            'emergency': ['Emergency Medicine'],
            'urgent': ['Emergency Medicine'],
            'critical': ['Emergency Medicine'],
            'life-threatening': ['Emergency Medicine']
        };
        
        // Combine diagnosis and symptoms for analysis
        const analysisText = [
            diagnosis?.primary_diagnosis || '',
            diagnosis?.ai_diagnosis || '',
            ...(symptoms || [])
        ].join(' ').toLowerCase();
        
        // Find matching specializations
        const matchedSpecializations = new Set();
        
        for (const [keyword, specializations] of Object.entries(diagnosisMapping)) {
            if (analysisText.includes(keyword)) {
                specializations.forEach(spec => matchedSpecializations.add(spec));
            }
        }
        
        // Age-based recommendations
        if (patientAge !== null) {
            if (patientAge < 18) {
                matchedSpecializations.add('Pediatrics');
            } else if (patientAge > 65) {
                matchedSpecializations.add('Geriatrics');
                matchedSpecializations.add('Internal Medicine');
            }
        }
        
        // If no specific matches, default to Internal Medicine
        if (matchedSpecializations.size === 0) {
            matchedSpecializations.add('Internal Medicine');
        }
        
        // Get specialists for matched specializations
        for (const specialization of matchedSpecializations) {
            const specialists = this.getSpecialistsBySpecialization(specialization);
            recommendations.push(...specialists.map(specialist => ({
                ...specialist,
                recommendationReason: this.getRecommendationReason(specialization, analysisText),
                matchScore: this.calculateMatchScore(specialist, analysisText, specialization)
            })));
        }
        
        // Sort by availability and match score
        return recommendations
            .sort((a, b) => {
                // Prioritize available specialists
                const aAvailable = a.availability?.status === 'available' ? 1 : 0;
                const bAvailable = b.availability?.status === 'available' ? 1 : 0;
                
                if (aAvailable !== bAvailable) {
                    return bAvailable - aAvailable;
                }
                
                // Then by match score
                return b.matchScore - a.matchScore;
            })
            .slice(0, 5); // Return top 5 recommendations
    }
    
    getRecommendationReason(specialization, analysisText) {
        const reasons = {
            'Cardiology': 'Recommended for cardiovascular conditions and heart-related symptoms',
            'Neurology': 'Recommended for neurological conditions and brain-related symptoms',
            'Pulmonology': 'Recommended for respiratory conditions and lung-related symptoms',
            'Gastroenterology': 'Recommended for digestive system conditions',
            'Surgery': 'Recommended for surgical conditions and trauma',
            'Emergency Medicine': 'Recommended for urgent and emergency conditions',
            'Internal Medicine': 'Recommended for general medical conditions and comprehensive care',
            'Pediatrics': 'Recommended for pediatric patients and child-specific conditions',
            'Obstetrics & Gynecology': 'Recommended for women\'s health and pregnancy-related conditions',
            'Infectious Diseases': 'Recommended for infectious and communicable diseases',
            'Orthopedics': 'Recommended for bone, joint, and musculoskeletal conditions'
        };
        
        return reasons[specialization] || 'Recommended based on condition analysis';
    }
    
    calculateMatchScore(specialist, analysisText, primarySpecialization) {
        let score = 0;
        
        // Base score for primary specialization match
        if (specialist.specialization === primarySpecialization) {
            score += 100;
        }
        
        // Additional score for subspecialty matches
        specialist.subSpecialties?.forEach(subSpec => {
            if (analysisText.includes(subSpec.toLowerCase())) {
                score += 50;
            }
        });
        
        // Availability bonus
        if (specialist.availability?.status === 'available') {
            score += 30;
        } else if (specialist.availability?.status === 'partially-available') {
            score += 15;
        }
        
        // Experience bonus
        score += Math.min(specialist.experience || 0, 20);
        
        // Rating bonus
        score += (specialist.rating || 0) * 5;
        
        return score;
    }

    // Real-time updates
    startRealTimeUpdates() {
        // Update availability status every 2 minutes
        setInterval(() => {
            this.updateRandomAvailability();
        }, 120000);

        // Update online status every 30 seconds
        setInterval(() => {
            this.updateOnlineStatus();
        }, 30000);
    }

    updateRandomAvailability() {
        const specialistIds = Object.keys(this.availabilityStatus);
        const randomId = specialistIds[Math.floor(Math.random() * specialistIds.length)];
        
        if (Math.random() < 0.3) { // 30% chance of status change
            const newStatus = this.getRandomStatus();
            this.updateAvailabilityStatus(parseInt(randomId), newStatus);
        }
    }

    updateOnlineStatus() {
        Object.keys(this.availabilityStatus).forEach(specialistId => {
            if (Math.random() < 0.1) { // 10% chance of online status change
                this.availabilityStatus[specialistId].isOnline = Math.random() > 0.2; // 80% chance of being online
            }
        });
        this.saveAvailabilityStatus();
    }

    notifyAvailabilityChange(specialistId, newStatus) {
        // Dispatch custom event for real-time updates
        const event = new CustomEvent('specialistAvailabilityChanged', {
            detail: {
                specialistId: specialistId,
                newStatus: newStatus,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // Data persistence
    saveSpecialists() {
        localStorage.setItem('specialists', JSON.stringify(this.specialists));
    }

    saveAvailabilityStatus() {
        localStorage.setItem('specialistAvailability', JSON.stringify(this.availabilityStatus));
    }

    // Statistics and analytics
    getStatistics() {
        const total = this.specialists.length;
        const available = Object.values(this.availabilityStatus).filter(a => a.status === 'available').length;
        const busy = Object.values(this.availabilityStatus).filter(a => a.status === 'busy').length;
        const partiallyAvailable = Object.values(this.availabilityStatus).filter(a => a.status === 'partially-available').length;
        const online = Object.values(this.availabilityStatus).filter(a => a.isOnline).length;

        return {
            total,
            available,
            busy,
            partiallyAvailable,
            online,
            offline: total - online,
            specializations: this.specializations.length,
            averageRating: (this.specialists.reduce((sum, s) => sum + s.rating, 0) / total).toFixed(1),
            averageExperience: Math.round(this.specialists.reduce((sum, s) => sum + s.experience, 0) / total)
        };
    }

    // Nearest specialist location finder
    findNearestSpecialists(userLocation, specialization = null, maxResults = 10) {
        // Define major cities with approximate coordinates for distance calculation
        const cityCoordinates = {
            'Nairobi, Kenya': { lat: -1.2921, lng: 36.8219 },
            'London, UK': { lat: 51.5074, lng: -0.1278 },
            'Cairo, Egypt': { lat: 30.0444, lng: 31.2357 },
            'Lagos, Nigeria': { lat: 6.5244, lng: 3.3792 },
            'Cape Town, South Africa': { lat: -33.9249, lng: 18.4241 },
            'Accra, Ghana': { lat: 5.6037, lng: -0.1870 },
            'Addis Ababa, Ethiopia': { lat: 9.1450, lng: 40.4897 },
            'Kampala, Uganda': { lat: 0.3476, lng: 32.5825 },
            'Dar es Salaam, Tanzania': { lat: -6.7924, lng: 39.2083 },
            'Kigali, Rwanda': { lat: -1.9441, lng: 30.0619 },
            'Lusaka, Zambia': { lat: -15.3875, lng: 28.3228 },
            'Harare, Zimbabwe': { lat: -17.8292, lng: 31.0522 },
            'Maputo, Mozambique': { lat: -25.9692, lng: 32.5732 },
            'Windhoek, Namibia': { lat: -22.5609, lng: 17.0658 },
            'Gaborone, Botswana': { lat: -24.6282, lng: 25.9231 },
            'Maseru, Lesotho': { lat: -29.3151, lng: 27.4869 },
            'Mbabane, Eswatini': { lat: -26.3054, lng: 31.1367 },
            'Antananarivo, Madagascar': { lat: -18.8792, lng: 47.5079 },
            'Port Louis, Mauritius': { lat: -20.1609, lng: 57.5012 },
            'Victoria, Seychelles': { lat: -4.6796, lng: 55.4920 }
        };

        // Get user coordinates
        const userCoords = cityCoordinates[userLocation];
        if (!userCoords) {
            console.warn(`Location "${userLocation}" not found in database. Using text-based matching.`);
            return this.findSpecialistsByLocationText(userLocation, specialization, maxResults);
        }

        // Filter specialists by specialization if provided
        let specialists = specialization 
            ? this.getSpecialistsBySpecialization(specialization)
            : this.getAllSpecialists();

        // Calculate distances and sort by proximity
        const specialistsWithDistance = specialists.map(specialist => {
            const specialistCoords = cityCoordinates[specialist.location];
            let distance = Infinity;
            
            if (specialistCoords) {
                distance = this.calculateDistance(
                    userCoords.lat, userCoords.lng,
                    specialistCoords.lat, specialistCoords.lng
                );
            }

            return {
                ...specialist,
                distance: distance,
                distanceText: distance === Infinity ? 'Unknown' : `${Math.round(distance)} km`
            };
        });

        // Sort by distance (nearest first) and return top results
        return specialistsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxResults);
    }

    // Fallback method for text-based location matching
    findSpecialistsByLocationText(userLocation, specialization = null, maxResults = 10) {
        const userLocationLower = userLocation.toLowerCase();
        
        let specialists = specialization 
            ? this.getSpecialistsBySpecialization(specialization)
            : this.getAllSpecialists();

        // Score specialists based on location similarity
        const specialistsWithScore = specialists.map(specialist => {
            const specialistLocation = specialist.location.toLowerCase();
            const country = specialist.country.toLowerCase();
            
            let score = 0;
            
            // Exact location match
            if (specialistLocation === userLocationLower) {
                score = 100;
            }
            // Same city
            else if (specialistLocation.includes(userLocationLower.split(',')[0])) {
                score = 80;
            }
            // Same country
            else if (country.includes(userLocationLower) || userLocationLower.includes(country)) {
                score = 60;
            }
            // Partial match
            else if (specialistLocation.includes(userLocationLower) || userLocationLower.includes(specialistLocation)) {
                score = 40;
            }

            return {
                ...specialist,
                locationScore: score,
                distanceText: score === 100 ? 'Same location' : 
                             score >= 80 ? 'Same city' :
                             score >= 60 ? 'Same country' : 'Different region'
            };
        });

        // Sort by location score and return top results
        return specialistsWithScore
            .sort((a, b) => b.locationScore - a.locationScore)
            .slice(0, maxResults);
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Get available locations for user selection
    getAvailableLocations() {
        const locations = [...new Set(this.specialists.map(s => s.location))];
        return locations.sort();
    }

    // Get specialists in a specific country
    getSpecialistsByCountry(country) {
        return this.specialists
            .filter(s => s.country.toLowerCase().includes(country.toLowerCase()))
            .map(specialist => ({
                ...specialist,
                availability: this.availabilityStatus[specialist.id]
            }));
    }
}

// Initialize global specialist database
window.specialistDB = new SpecialistDatabase();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpecialistDatabase;
}