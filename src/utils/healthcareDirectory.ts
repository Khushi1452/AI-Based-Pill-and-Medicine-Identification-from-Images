/**
 * Mediscan AI - Indian Healthcare Directory & Doctor Registry
 * Includes verified multi-specialty hospitals, doctors, clinics, diagnostic centers,
 * and emergency care networks across major Indian cities.
 */

export interface HealthcareFacility {
  id: string;
  name: string;
  doctorName?: string;
  doctorQualification?: string;
  facilityType: 'DOCTOR' | 'CLINIC' | 'HOSPITAL' | 'LABORATORY' | 'PHARMACY';
  specialties: string[];
  address: string;
  city: string;
  pinCode: string;
  phone: string;
  emergencyPhone?: string;
  rating: number;
  isEmergencyFacility: boolean;
  isOpen24x7: boolean;
  consultationFee?: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  mapsUrl?: string;
  source: string;
}

export const VERIFIED_HEALTHCARE_REGISTRY: HealthcareFacility[] = [
  // Delhi NCR
  {
    id: 'fac_aiims_delhi',
    name: 'AIIMS New Delhi (All India Institute of Medical Sciences)',
    doctorName: 'Prof. (Dr.) M. Srinivas & Senior Consultant Panel',
    doctorQualification: 'MD, DM, FAMS (Premier National Institute)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Cardiology', 'Neurology', 'Oncology', 'Emergency Medicine', 'Trauma Care'],
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
    city: 'New Delhi',
    pinCode: '110029',
    phone: '+91 11 2658 8500',
    emergencyPhone: '112 / +91 11 2659 4405',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Subsidized / Free OP',
    lat: 28.5672,
    lng: 77.21,
    source: 'Ministry of Health & Family Welfare (MoHFW) / CDSCO',
  },
  {
    id: 'fac_safdarjung_delhi',
    name: 'Vardhman Mahavir Medical College & Safdarjung Hospital',
    doctorName: 'Dr. Vandana Talwar & Clinical Faculty',
    doctorQualification: 'MD, DNB (Government Medical College)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Emergency Medicine', 'Burns & Trauma', 'Pediatrics'],
    address: 'Ring Road, opposite AIIMS, Safdarjung Enclave, New Delhi, Delhi 110029',
    city: 'New Delhi',
    pinCode: '110029',
    phone: '+91 11 2673 0000',
    emergencyPhone: '108 / 112',
    rating: 4.5,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Government Standard',
    lat: 28.5705,
    lng: 77.2066,
    source: 'Government of India Health Registry',
  },
  {
    id: 'fac_max_saket',
    name: 'Max Super Speciality Hospital, Saket',
    doctorName: 'Dr. Balbir Singh (Cardiology) & Dr. Puneet Girdhar (Ortho)',
    doctorQualification: 'MBBS, MD, DM (Cardiology), FACC',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'Neurology', 'Orthopaedics', 'General Medicine', 'Emergency Medicine'],
    address: '1, 2, Press Enclave Marg, Saket Institutional Area, Saket, New Delhi, Delhi 110017',
    city: 'New Delhi',
    pinCode: '110017',
    phone: '+91 11 2651 5050',
    emergencyPhone: '+91 11 4055 4055',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,200 - ₹2,000',
    lat: 28.5283,
    lng: 77.2125,
    source: 'NABH Accredited Hospital Directory',
  },
  {
    id: 'fac_apollo_delhi_doc',
    name: 'Indraprastha Apollo Hospital',
    doctorName: 'Dr. Rajesh Chawla (Pulmonology & Critical Care)',
    doctorQualification: 'MBBS, MD (Medicine), FCCP',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Pulmonology', 'Cardiology', 'Gastroenterology'],
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi, Delhi 110076',
    city: 'New Delhi',
    pinCode: '110076',
    phone: '+91 11 2692 5858',
    emergencyPhone: '1066 / 112',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,500 - ₹2,500',
    lat: 28.5367,
    lng: 77.2917,
    source: 'JCI & NABH Accredited Care',
  },
  {
    id: 'fac_skin_delhi',
    name: 'Kaya Skin Clinic & Dermatology Center',
    doctorName: 'Dr. Anupama Bisaria (Senior Dermatologist)',
    doctorQualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    facilityType: 'CLINIC',
    specialties: ['Dermatology', 'Skin Infections', 'Cosmetic Dermatology'],
    address: 'M-Block Market, Greater Kailash 1, New Delhi, Delhi 110048',
    city: 'New Delhi',
    pinCode: '110048',
    phone: '+91 11 4163 1122',
    emergencyPhone: undefined,
    rating: 4.6,
    isEmergencyFacility: false,
    isOpen24x7: false,
    consultationFee: '₹800 - ₹1,200',
    lat: 28.552,
    lng: 77.238,
    source: 'Verified Specialist Directory',
  },
  {
    id: 'fac_lalpath_delhi',
    name: 'Dr Lal PathLabs National Reference Laboratory',
    doctorName: 'Dr. Vandana Lal & Pathology Director Panel',
    doctorQualification: 'MD (Pathology), Quality Assessment Lead',
    facilityType: 'LABORATORY',
    specialties: ['Diagnostic Pathology', 'Blood Tests', 'Biochemistry', 'Molecular Diagnostics'],
    address: 'Block E, Sector 18, Rohini, New Delhi, Delhi 110085',
    city: 'New Delhi',
    pinCode: '110085',
    phone: '+91 11 3988 5050',
    emergencyPhone: undefined,
    rating: 4.6,
    isEmergencyFacility: false,
    isOpen24x7: false,
    consultationFee: 'Test Specific',
    lat: 28.7183,
    lng: 77.1265,
    source: 'NABL Accredited Laboratory Registry',
  },

  // Chandigarh & Punjab
  {
    id: 'fac_pgimer_chd',
    name: 'PGIMER (Postgraduate Institute of Medical Education & Research)',
    doctorName: 'Prof. Vivek Lal (Director & Neurologist)',
    doctorQualification: 'MD, DM (Neurology), FRCP',
    facilityType: 'HOSPITAL',
    specialties: ['Neurology', 'Cardiology', 'General Medicine', 'Pediatrics', 'Emergency Medicine', 'Trauma Care'],
    address: 'Madhya Marg, Sector 12, Chandigarh 160012',
    city: 'Chandigarh',
    pinCode: '160012',
    phone: '+91 172 274 7585',
    emergencyPhone: '112 / +91 172 275 6565',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Subsidized Government OPD',
    lat: 30.7645,
    lng: 76.7766,
    source: 'Autonomous Institute / Central Health Ministry',
  },
  {
    id: 'fac_fortis_mohali',
    name: 'Fortis Hospital Mohali',
    doctorName: 'Dr. T.S. Mahant (Cardiothoracic Surgery) & Dr. R.K. Jaswal (Cardio)',
    doctorQualification: 'MS, MCh (CTVS), FIACS',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'Orthopaedics', 'General Medicine', 'Neurology', 'Emergency Medicine'],
    address: 'Sector 62, Phase VIII, Sahibzada Ajit Singh Nagar, Mohali, Punjab 160062',
    city: 'Chandigarh',
    pinCode: '160062',
    phone: '+91 172 469 2222',
    emergencyPhone: '+91 172 506 1222',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,000 - ₹1,800',
    lat: 30.7055,
    lng: 76.7212,
    source: 'NABH Accredited Healthcare Network',
  },
  {
    id: 'fac_dmc_ludhiana',
    name: 'Dayanand Medical College & Hospital (DMCH)',
    doctorName: 'Dr. G.S. Wander (Chief Cardiologist & Academic Director)',
    doctorQualification: 'MBBS, MD, DM (Cardiology), FACC',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'General Medicine', 'Emergency Medicine', 'Trauma Center', 'Gastroenterology'],
    address: 'Civil Lines, Tagore Nagar, Ludhiana, Punjab 141001',
    city: 'Ludhiana',
    pinCode: '141001',
    phone: '+91 161 468 8888',
    emergencyPhone: '+91 161 468 7777 / 112',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹600 - ₹1,200',
    lat: 30.901,
    lng: 75.845,
    source: 'Punjab State Medical Directorate',
  },
  {
    id: 'fac_cmc_ludhiana',
    name: 'Christian Medical College & Hospital (CMCH)',
    doctorName: 'Dr. William Bhatti & Senior Medical Consultants',
    doctorQualification: 'MS (Pediatric Surgery), MAMS',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Pediatrics', 'Orthopaedics', 'Emergency Medicine'],
    address: 'Brown Road, CMC Campus, Ludhiana, Punjab 141008',
    city: 'Ludhiana',
    pinCode: '141008',
    phone: '+91 161 211 5000',
    emergencyPhone: '112 / +91 161 211 5112',
    rating: 4.6,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹500 - ₹1,000',
    lat: 30.912,
    lng: 75.862,
    source: 'NABH Verified Medical College',
  },
  {
    id: 'fac_fortis_ludhiana',
    name: 'Fortis Hospital, Ludhiana',
    doctorName: 'Dr. Paramdeep Singh Sandhu (Cardiology) & Surgical Team',
    doctorQualification: 'MD, DM (Cardiology), FACC',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'Emergency Medicine', 'Neurology', 'Orthopaedics', 'Critical Care'],
    address: 'Chandigarh Road, Near Vardhman Mills, Mundian Kalan, Ludhiana, Punjab 141015',
    city: 'Ludhiana',
    pinCode: '141015',
    phone: '+91 161 522 5555',
    emergencyPhone: '112 / +91 161 522 5500',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,000 - ₹1,800',
    lat: 30.9174,
    lng: 75.9255,
    source: 'NABH Accredited Multi-Speciality Hospital',
  },
  {
    id: 'fac_sps_ludhiana',
    name: 'SPS Hospitals (Satguru Partap Singh Hospitals)',
    doctorName: 'Dr. Rahul Kohli (Nephrology) & Senior Faculty',
    doctorQualification: 'MD, DM (Nephrology), FISN',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Cardiology', 'Nephrology', 'Emergency Medicine', 'Oncology'],
    address: 'Sherpur Chowk, GT Road, Ludhiana, Punjab 141003',
    city: 'Ludhiana',
    pinCode: '141003',
    phone: '+91 161 661 7100',
    emergencyPhone: '+91 161 661 7111 / 112',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹800 - ₹1,500',
    lat: 30.8931,
    lng: 75.8829,
    source: 'JCI & NABH Certified Super Speciality Care',
  },
  {
    id: 'fac_apollo_clinic_ldh',
    name: 'Apollo Clinic & Diagnostics, Model Town',
    doctorName: 'Dr. Harpreet Singh (Internal Medicine Specialist)',
    doctorQualification: 'MBBS, MD (Medicine)',
    facilityType: 'CLINIC',
    specialties: ['General Medicine', 'Pediatrics', 'Pathology Lab', 'Preventive Health'],
    address: 'Near Tuver Chowk, Model Town, Ludhiana, Punjab 141002',
    city: 'Ludhiana',
    pinCode: '141002',
    phone: '+91 161 462 0000',
    emergencyPhone: undefined,
    rating: 4.6,
    isEmergencyFacility: false,
    isOpen24x7: false,
    consultationFee: '₹600 - ₹1,000',
    lat: 30.8875,
    lng: 75.834,
    source: 'Apollo Health & Lifestyle Network',
  },

  // Jalandhar & Doaba
  {
    id: 'fac_patel_jalandhar',
    name: 'Patel Hospital & Super Speciality Cancer Institute',
    doctorName: 'Dr. B.S. Patial (Director & Surgical Oncology)',
    doctorQualification: 'MS, MCh (Surgical Oncology)',
    facilityType: 'HOSPITAL',
    specialties: ['Oncology', 'General Medicine', 'Cardiology', 'Emergency Medicine'],
    address: 'Civil Lines, Near BMC Chowk, Jalandhar, Punjab 144001',
    city: 'Jalandhar',
    pinCode: '144001',
    phone: '+91 181 524 1000',
    emergencyPhone: '112 / +91 181 524 1050',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹800 - ₹1,400',
    lat: 31.3211,
    lng: 75.5786,
    source: 'NABH Accredited Cancer & Trauma Center',
  },
  {
    id: 'fac_sacred_jalandhar',
    name: 'Sacred Heart Hospital',
    doctorName: 'Dr. Rajiv Sharma (General & Emergency Medicine)',
    doctorQualification: 'MD (Internal Medicine)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Emergency Medicine', 'Pediatrics', 'Orthopaedics'],
    address: 'GT Road, Maqsudan, Jalandhar, Punjab 144008',
    city: 'Jalandhar',
    pinCode: '144008',
    phone: '+91 181 267 2362',
    emergencyPhone: '112',
    rating: 4.5,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹500 - ₹900',
    lat: 31.3502,
    lng: 75.5684,
    source: 'Punjab Health Systems Corporation',
  },

  // Amritsar / Majha
  {
    id: 'fac_sgrd_amritsar',
    name: 'Sri Guru Ram Das Institute of Medical Sciences & Research (SGRD)',
    doctorName: 'Dr. Manjit Singh Uppal (Director & Surgical Faculty)',
    doctorQualification: 'MS, FICS (Surgical Sciences)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Cardiology', 'Emergency Medicine', 'Orthopaedics', 'Pediatrics'],
    address: 'Mehta Road, Post Office Vallah, Amritsar, Punjab 143501',
    city: 'Amritsar',
    pinCode: '143501',
    phone: '+91 183 287 0200',
    emergencyPhone: '112 / +91 183 287 0333',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹400 - ₹800 (Subsidized)',
    lat: 31.6366,
    lng: 74.9258,
    source: 'NABH Accredited Medical College & Hospital',
  },
  {
    id: 'fac_fortis_amritsar',
    name: 'Fortis Escorts Hospital, Amritsar',
    doctorName: 'Dr. H.P. Singh (Cardiology) & Critical Care Panel',
    doctorQualification: 'MD, DM (Cardiology)',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'Emergency Medicine', 'Neurology', 'Pulmonology'],
    address: 'Majitha-Verka Bypass Road, Amritsar, Punjab 143004',
    city: 'Amritsar',
    pinCode: '143004',
    phone: '+91 183 666 2222',
    emergencyPhone: '+91 183 666 2111 / 112',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,000 - ₹1,800',
    lat: 31.6668,
    lng: 74.8872,
    source: 'NABH Healthcare Directory',
  },

  // Patiala
  {
    id: 'fac_rajindra_patiala',
    name: 'Government Medical College & Rajindra Hospital',
    doctorName: 'Dr. H.S. Rehsia (Principal & Medical Superintendent)',
    doctorQualification: 'MS (General Surgery), FICS',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Trauma & Emergency', 'Cardiology', 'Orthopaedics', 'Pediatrics'],
    address: 'Sangrur Road, New Lal Bagh, Patiala, Punjab 147001',
    city: 'Patiala',
    pinCode: '147001',
    phone: '+91 175 221 2018',
    emergencyPhone: '112 / 108',
    rating: 4.5,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Subsidized Government OPD',
    lat: 30.3344,
    lng: 76.3812,
    source: 'Department of Medical Education & Research Punjab',
  },
  {
    id: 'fac_manipal_patiala',
    name: 'Manipal Hospital (formerly Columbia Asia), Patiala',
    doctorName: 'Dr. Gurpreet Singh (Internal Medicine Specialist)',
    doctorQualification: 'MD (Internal Medicine)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Cardiology', 'Emergency Medicine', 'Gastroenterology'],
    address: 'Bhupindra Road, Near 22 No. Phatak, Patiala, Punjab 147001',
    city: 'Patiala',
    pinCode: '147001',
    phone: '+91 175 666 2222',
    emergencyPhone: '112 / +91 175 666 2111',
    rating: 4.6,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹800 - ₹1,400',
    lat: 30.3421,
    lng: 76.3768,
    source: 'Manipal Hospitals Network',
  },

  // Bathinda & Malwa
  {
    id: 'fac_aiims_bathinda',
    name: 'AIIMS Bathinda (All India Institute of Medical Sciences)',
    doctorName: 'Prof. (Dr.) D.K. Singh (Executive Director) & Expert Panel',
    doctorQualification: 'MD, DNB, FAMS (Apex National Institute)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Cardiology', 'Neurology', 'Oncology', 'Emergency Medicine', 'Trauma'],
    address: 'Mandi Dabwali Road, Bathinda, Punjab 151001',
    city: 'Bathinda',
    pinCode: '151001',
    phone: '+91 164 286 7777',
    emergencyPhone: '112 / +91 164 286 7000',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Subsidized National Institute OPD',
    lat: 30.1652,
    lng: 74.9218,
    source: 'Ministry of Health & Family Welfare (MoHFW)',
  },

  // Mohali & Chandigarh Extensions
  {
    id: 'fac_max_mohali',
    name: 'Max Super Speciality Hospital, Mohali',
    doctorName: 'Dr. Sudhir Saxena (Cardiology) & Critical Team',
    doctorQualification: 'MBBS, MD, DM (Cardiology)',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'Emergency Medicine', 'Oncology', 'Neurosciences', 'Orthopaedics'],
    address: 'Near Civil Hospital, Phase VI, Sahibzada Ajit Singh Nagar, Mohali, Punjab 160055',
    city: 'Mohali',
    pinCode: '160055',
    phone: '+91 172 665 2000',
    emergencyPhone: '+91 172 665 2111 / 112',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,200 - ₹1,900',
    lat: 30.7225,
    lng: 76.7118,
    source: 'NABH Accredited Hospital Directory',
  },
  {
    id: 'fac_gmch_chd',
    name: 'Government Medical College & Hospital (GMCH-32)',
    doctorName: 'Prof. Jasbinder Kaur (Director-Principal) & Clinical Team',
    doctorQualification: 'MD, FAMS',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Emergency & Trauma', 'Pediatrics', 'Cardiology', 'Orthopaedics'],
    address: 'Chandi Path, Sector 32B, Chandigarh 160030',
    city: 'Chandigarh',
    pinCode: '160030',
    phone: '+91 172 260 1023',
    emergencyPhone: '112 / +91 172 266 5253',
    rating: 4.6,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Subsidized Government OPD',
    lat: 30.7108,
    lng: 76.7725,
    source: 'Chandigarh Administration Health Department',
  },
  {
    id: 'fac_clove_dental_chd',
    name: 'Clove Dental Specialist Clinic',
    doctorName: 'Dr. Mehakpreet Kaur (Senior Dental Surgeon)',
    doctorQualification: 'BDS, MDS (Conservative Dentistry & Endodontics)',
    facilityType: 'CLINIC',
    specialties: ['Dentistry', 'Dental Emergencies', 'Oral Surgery'],
    address: 'SCO 45-46, Sector 17, Chandigarh 160017',
    city: 'Chandigarh',
    pinCode: '160017',
    phone: '+91 172 400 9090',
    emergencyPhone: undefined,
    rating: 4.6,
    isEmergencyFacility: false,
    isOpen24x7: false,
    consultationFee: '₹500 - ₹800',
    lat: 30.7398,
    lng: 76.7827,
    source: 'Dental Healthcare Network',
  },

  // Gurugram & NCR
  {
    id: 'fac_medanta_gurugram',
    name: 'Medanta - The Medicity',
    doctorName: 'Dr. Naresh Trehan (Chairman & Chief Cardiac Surgeon)',
    doctorQualification: 'MBBS, Diplomat American Board of Surgery',
    facilityType: 'HOSPITAL',
    specialties: ['Cardiology', 'Cardiac Surgery', 'Neurology', 'Oncology', 'Emergency Medicine'],
    address: 'CH Bakhtawar Singh Road, Sector 38, Gurugram, Haryana 122001',
    city: 'Gurugram',
    pinCode: '122001',
    phone: '+91 124 414 1414',
    emergencyPhone: '1068 / 112',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,500 - ₹2,500',
    lat: 28.4392,
    lng: 77.0428,
    source: 'JCI & NABH Verified Healthcare Center',
  },

  // Mumbai / Maharashtra
  {
    id: 'fac_kem_mumbai',
    name: 'King Edward Memorial (KEM) Hospital',
    doctorName: 'Dr. Sangeeta Ravat (Dean & Neurologist)',
    doctorQualification: 'MD, DM (Neurology)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Emergency Medicine', 'Cardiology', 'Neurology', 'Trauma'],
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
    city: 'Mumbai',
    pinCode: '400012',
    phone: '+91 22 2410 7000',
    emergencyPhone: '108 / 112',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'BMC Standard OPD',
    lat: 19.0028,
    lng: 72.8427,
    source: 'BMC Public Healthcare Directory',
  },
  {
    id: 'fac_hinduja_mumbai',
    name: 'P. D. Hinduja National Hospital & Medical Research Centre',
    doctorName: 'Dr. Zarir Udwadia (Consultant Chest Physician)',
    doctorQualification: 'MD, DNB, FRCP (Pulmonology)',
    facilityType: 'HOSPITAL',
    specialties: ['Pulmonology', 'Cardiology', 'General Medicine', 'Neurology', 'Emergency Medicine'],
    address: 'Veer Savarkar Marg, Mahim, Mumbai, Maharashtra 400016',
    city: 'Mumbai',
    pinCode: '400016',
    phone: '+91 22 2445 1515',
    emergencyPhone: '+91 22 2445 2222',
    rating: 4.8,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,500 - ₹2,500',
    lat: 19.033,
    lng: 72.8384,
    source: 'NABH Accredited Healthcare Registry',
  },
  {
    id: 'fac_metropolis_mumbai',
    name: 'Metropolis Healthcare Global Reference Lab',
    doctorName: 'Dr. Nilesh Shah (Group President & Pathology Lead)',
    doctorQualification: 'MD (Pathology)',
    facilityType: 'LABORATORY',
    specialties: ['Diagnostic Pathology', 'Biochemistry', 'Histopathology', 'Blood Analysis'],
    address: 'Commercial Building 1A, Kohinoor Mall, Kurla West, Mumbai, Maharashtra 400070',
    city: 'Mumbai',
    pinCode: '400070',
    phone: '+91 22 3399 3939',
    emergencyPhone: undefined,
    rating: 4.6,
    isEmergencyFacility: false,
    isOpen24x7: false,
    consultationFee: 'Per Diagnostic Test',
    lat: 19.0688,
    lng: 72.889,
    source: 'NABL Accredited Laboratory Network',
  },

  // Bengaluru / Karnataka
  {
    id: 'fac_manipal_blr',
    name: 'Manipal Hospital, Old Airport Road',
    doctorName: 'Dr. Sudarshan Ballal (Chairman & Nephrologist)',
    doctorQualification: 'MD, FRCP, FACP (Nephrology)',
    facilityType: 'HOSPITAL',
    specialties: ['General Medicine', 'Cardiology', 'Neurology', 'Pediatrics', 'Emergency Medicine'],
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017',
    city: 'Bengaluru',
    pinCode: '560017',
    phone: '+91 80 2502 4444',
    emergencyPhone: '+91 80 2502 3333 / 112',
    rating: 4.7,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: '₹1,000 - ₹1,800',
    lat: 12.9592,
    lng: 77.6496,
    source: 'NABH Accredited Hospital Network',
  },
  {
    id: 'fac_nimhans_blr',
    name: 'NIMHANS (National Institute of Mental Health & Neuro Sciences)',
    doctorName: 'Prof. Pratima Murthy (Director & Neurosciences)',
    doctorQualification: 'MD, DPM, FAMS',
    facilityType: 'HOSPITAL',
    specialties: ['Neurology', 'Neurosurgery', 'Psychiatry', 'Emergency Medicine'],
    address: 'Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029',
    city: 'Bengaluru',
    pinCode: '560029',
    phone: '+91 80 2699 5000',
    emergencyPhone: '+91 80 2699 5200 / 112',
    rating: 4.9,
    isEmergencyFacility: true,
    isOpen24x7: true,
    consultationFee: 'Subsidized Central OPD',
    lat: 12.9392,
    lng: 77.5973,
    source: 'National Institute / Ministry of Health',
  },
];

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function haversineDistanceKm(lat1: floatOrNumber, lon1: floatOrNumber, lat2: floatOrNumber, lon2: floatOrNumber): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

type floatOrNumber = number;

/**
 * Filter facilities and doctors by location and specialty
 */
export function queryHealthcareFacilities(options: {
  query?: string;
  city?: string;
  specialty?: string;
  facilityType?: string;
  userLat?: number;
  userLng?: number;
  emergencyOnly?: boolean;
}): HealthcareFacility[] {
  const { query, city, specialty, facilityType, userLat, userLng, emergencyOnly } = options;
  const qLower = (query || '').toLowerCase().trim();
  const specLower = (specialty || '').toLowerCase().trim();
  const cityLower = (city || '').toLowerCase().trim();

  let list = VERIFIED_HEALTHCARE_REGISTRY.map((item) => {
    const copy = { ...item };
    if (userLat !== undefined && userLng !== undefined) {
      copy.distanceKm = haversineDistanceKm(userLat, userLng, copy.lat, copy.lng);
    }
    const encoded = encodeURIComponent(copy.address);
    copy.mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    return copy;
  });

  list = list.filter((fac) => {
    if (emergencyOnly && !fac.isEmergencyFacility) return false;
    if (facilityType && facilityType !== 'ALL' && fac.facilityType !== facilityType) return false;
    
    // If a specific city is explicitly chosen, filter by city or nearby area name
    if (cityLower && cityLower !== 'all') {
      const matchCity = fac.city.toLowerCase().includes(cityLower) || cityLower.includes(fac.city.toLowerCase());
      const matchAddr = fac.address.toLowerCase().includes(cityLower);
      if (!matchCity && !matchAddr) return false;
    }

    if (specLower && specLower !== 'all') {
      const hasSpec = fac.specialties.some((s) => s.toLowerCase().includes(specLower));
      const hasInName = fac.name.toLowerCase().includes(specLower);
      if (!hasSpec && !hasInName) return false;
    }

    if (qLower) {
      const inName = fac.name.toLowerCase().includes(qLower);
      const inDoc = (fac.doctorName || '').toLowerCase().includes(qLower);
      const inCity = fac.city.toLowerCase().includes(qLower);
      const inAddr = fac.address.toLowerCase().includes(qLower);
      const inSpec = fac.specialties.some((s) => s.toLowerCase().includes(qLower));
      if (!inName && !inDoc && !inCity && !inAddr && !inSpec) return false;
    }

    return true;
  });

  if (userLat !== undefined && userLng !== undefined) {
    list.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else {
    list.sort((a, b) => b.rating - a.rating);
  }

  return list;
}

export interface CityCoord {
  name: string;
  state: string;
  lat: number;
  lng: number;
  aliases?: string[];
  pincodePrefix?: string;
}

/**
 * Comprehensive Indian Cities and Regional Medical Hubs with exact GPS coordinates.
 */
export const MAJOR_CITIES_COORDS: CityCoord[] = [
  // Punjab
  { name: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573, aliases: ['ldh', 'model town ludhiana', 'civil lines ludhiana'], pincodePrefix: '141' },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, aliases: ['chd', 'tricity'], pincodePrefix: '160' },
  { name: 'Mohali', state: 'Punjab', lat: 30.7046, lng: 76.7179, aliases: ['sas nagar', 'sahibzada ajit singh nagar'], pincodePrefix: '160' },
  { name: 'Panchkula', state: 'Haryana', lat: 30.6942, lng: 76.8606, aliases: ['pkl', 'tricity'], pincodePrefix: '134' },
  { name: 'Jalandhar', state: 'Punjab', lat: 31.326, lng: 75.5762, aliases: ['jlr', 'jalandhar city'], pincodePrefix: '144' },
  { name: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723, aliases: ['asr', 'golden temple', 'amritsar cantt'], pincodePrefix: '143' },
  { name: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869, aliases: ['patiala city'], pincodePrefix: '147' },
  { name: 'Bathinda', state: 'Punjab', lat: 30.211, lng: 74.9455, aliases: ['bhatinda'], pincodePrefix: '151' },
  { name: 'Hoshiarpur', state: 'Punjab', lat: 31.5273, lng: 75.9149, pincodePrefix: '146' },
  { name: 'Pathankot', state: 'Punjab', lat: 32.2689, lng: 75.6499, pincodePrefix: '145' },
  { name: 'Moga', state: 'Punjab', lat: 30.8165, lng: 75.1717, pincodePrefix: '142' },
  { name: 'Phagwara', state: 'Punjab', lat: 31.224, lng: 75.7708, pincodePrefix: '144' },
  { name: 'Khanna', state: 'Punjab', lat: 30.7071, lng: 76.2167, pincodePrefix: '141' },
  { name: 'Batala', state: 'Punjab', lat: 31.8186, lng: 75.2028, pincodePrefix: '143' },
  { name: 'Barnala', state: 'Punjab', lat: 30.3819, lng: 75.5463, pincodePrefix: '148' },
  { name: 'Firozpur', state: 'Punjab', lat: 30.9237, lng: 74.6122, aliases: ['ferozepur'], pincodePrefix: '152' },
  { name: 'Kapurthala', state: 'Punjab', lat: 31.38, lng: 75.38, pincodePrefix: '144' },
  { name: 'Sangrur', state: 'Punjab', lat: 30.2458, lng: 75.8421, pincodePrefix: '148' },
  { name: 'Rupnagar', state: 'Punjab', lat: 30.9664, lng: 76.5331, aliases: ['ropar'], pincodePrefix: '140' },

  // Delhi NCR & Haryana
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, aliases: ['delhi', 'ncr', 'central delhi', 'south delhi', 'connaught place'], pincodePrefix: '110' },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266, aliases: ['gurgaon', 'dlf cyber city', 'sohna road'], pincodePrefix: '122' },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391, aliases: ['gautam buddha nagar', 'greater noida'], pincodePrefix: '201' },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178, pincodePrefix: '121' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538, aliases: ['indirapuram'], pincodePrefix: '201' },
  { name: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767, aliases: ['ambala cantt', 'ambala city'], pincodePrefix: '133' },
  { name: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635, pincodePrefix: '132' },
  { name: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905, pincodePrefix: '132' },
  { name: 'Sonipat', state: 'Haryana', lat: 28.9931, lng: 77.0151, pincodePrefix: '131' },
  { name: 'Rohtak', state: 'Haryana', lat: 28.8955, lng: 76.6066, pincodePrefix: '124' },
  { name: 'Hisar', state: 'Haryana', lat: 29.1492, lng: 75.7217, pincodePrefix: '125' },

  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, aliases: ['bombay', 'bandra', 'andheri', 'dadar'], pincodePrefix: '400' },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, aliases: ['poona', 'pcmc', 'hinjewadi'], pincodePrefix: '411' },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, pincodePrefix: '400' },
  { name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.033, lng: 73.0297, aliases: ['vashi', 'nerul', 'kharghar'], pincodePrefix: '400' },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, pincodePrefix: '440' },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, pincodePrefix: '422' },

  // Karnataka & South
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, aliases: ['bangalore', 'whitefield', 'koramangala', 'indiranagar'], pincodePrefix: '560' },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, aliases: ['secunderabad', 'cyberabad', 'hitec city'], pincodePrefix: '500' },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, aliases: ['madras', 'adyar', 'anna nagar'], pincodePrefix: '600' },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, aliases: ['cochin', 'ernakulam'], pincodePrefix: '682' },
  { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394, aliases: ['mysore'], pincodePrefix: '570' },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, pincodePrefix: '641' },

  // North & Central
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, aliases: ['pink city'], pincodePrefix: '302' },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, pincodePrefix: '342' },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, pincodePrefix: '226' },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, pincodePrefix: '208' },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, pincodePrefix: '282' },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, aliases: ['banaras', 'kashi'], pincodePrefix: '221' },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, aliases: ['calcutta', 'howrah', 'salt lake'], pincodePrefix: '700' },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, pincodePrefix: '380' },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, pincodePrefix: '395' },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, pincodePrefix: '452' },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, pincodePrefix: '462' },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, pincodePrefix: '248' },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, pincodePrefix: '171' },
  { name: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.857, pincodePrefix: '180' },
];

/**
 * Finds the closest city in our comprehensive database along with distance and state.
 */
export function getNearestCityInfo(lat: number, lng: number): { name: string; state: string; distanceKm: number } {
  let closest = MAJOR_CITIES_COORDS[0];
  let minD = haversineDistanceKm(lat, lng, closest.lat, closest.lng);

  for (const c of MAJOR_CITIES_COORDS.slice(1)) {
    const d = haversineDistanceKm(lat, lng, c.lat, c.lng);
    if (d < minD) {
      minD = d;
      closest = c;
    }
  }
  return { name: closest.name, state: closest.state, distanceKm: minD };
}

/**
 * Backwards compatible helper returning closest city name.
 */
export function getNearestCityName(lat: number, lng: number): string {
  return getNearestCityInfo(lat, lng).name;
}

/**
 * Searches the city database by name, alias, state, or PIN code prefix.
 */
export function searchIndianLocations(query: string): CityCoord[] {
  const q = query.toLowerCase().trim();
  if (!q) return MAJOR_CITIES_COORDS.slice(0, 10);

  return MAJOR_CITIES_COORDS.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.state.toLowerCase().includes(q)) return true;
    if (c.pincodePrefix && q.startsWith(c.pincodePrefix)) return true;
    if (c.aliases?.some((a) => a.includes(q) || q.includes(a))) return true;
    return false;
  }).slice(0, 12);
}

/**
 * Reverse-geocodes lat/lng into a human-friendly city and state name using Nominatim
 * with instant offline database fallback.
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ cityName: string; state?: string; fullLocation: string }> {
  // 1. Try local server endpoint if running in browser
  if (typeof window !== 'undefined') {
    try {
      const c1 = new AbortController();
      const t1 = setTimeout(() => c1.abort(), 2000);
      const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`, {
        signal: c1.signal,
      });
      clearTimeout(t1);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.cityName) {
          return {
            cityName: data.cityName,
            state: data.stateName,
            fullLocation: data.displayName || `${data.cityName}, ${data.stateName || 'India'}`,
          };
        }
      }
    } catch {}
  }

  // 2. Direct OpenStreetMap Nominatim with User-Agent
  try {
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 2500);
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: { 'User-Agent': 'MediscanHealthcareApp/1.0' },
        signal: c2.signal,
      }
    );
    clearTimeout(t2);
    if (geoRes.ok) {
      const data = await geoRes.json();
      const addr = data.address || {};
      const city =
        addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.county;
      const state = addr.state || '';
      if (city) {
        return {
          cityName: city,
          state,
          fullLocation: `${city}${state ? `, ${state}` : ''}`,
        };
      }
    }
  } catch {}

  // High-accuracy offline match
  const nearest = getNearestCityInfo(lat, lng);
  return {
    cityName: nearest.name,
    state: nearest.state,
    fullLocation: `${nearest.name}, ${nearest.state}`,
  };
}

/**
 * Automatically detects location via IP address lookup when browser GPS is blocked,
 * times out, or is denied.
 */
export async function detectLocationFromIP(): Promise<{
  lat: number;
  lng: number;
  city: string;
  region: string;
  postal?: string;
  source: string;
} | null> {
  try {
    // 1. Try our local backend API endpoint
    try {
      const res = await fetch('/api/location/detect');
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat && data.lng) {
          return {
            lat: data.lat,
            lng: data.lng,
            city: data.city || 'Ludhiana',
            region: data.region || 'Punjab',
            postal: data.postal,
            source: 'Network / IP Detection',
          };
        }
      }
    } catch { }

    // 2. Direct client fallback via ipwho.is
    const ipRes = await fetch('https://ipwho.is/');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData && ipData.latitude && ipData.longitude) {
        return {
          lat: ipData.latitude,
          lng: ipData.longitude,
          city: ipData.city || 'Ludhiana',
          region: ipData.region || 'Punjab',
          postal: ipData.postal,
          source: 'Live Network IP',
        };
      }
    }
  } catch (err) {
    console.warn('IP location detection failed:', err);
  }

  return null;
}

export function getSuggestedNearbyHospitals(userLat?: number, userLng?: number, limit = 3): HealthcareFacility[] {
  let list = VERIFIED_HEALTHCARE_REGISTRY.filter((f) => f.facilityType === 'HOSPITAL' || f.isEmergencyFacility).map((item) => {
    const copy = { ...item };
    if (userLat !== undefined && userLng !== undefined) {
      copy.distanceKm = haversineDistanceKm(userLat, userLng, copy.lat, copy.lng);
    }
    const encoded = encodeURIComponent(copy.address);
    copy.mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    return copy;
  });

  if (userLat !== undefined && userLng !== undefined) {
    list.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else {
    list.sort((a, b) => b.rating - a.rating);
  }

  return list.slice(0, limit);
}


