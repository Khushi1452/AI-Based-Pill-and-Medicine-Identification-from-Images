import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Send,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  User,
  Clock,
  ShieldCheck,
  Building2,
  Printer,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Languages,
  Plus,
  HeartPulse,
  Activity,
  FileText,
  Camera,
  Upload,
  X,
  Pill,
  Eye,
  ZoomIn,
  Search,
  Navigation,
  Crosshair,
  Edit3,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import {
  HealthcareFacility,
  queryHealthcareFacilities,
  getNearestCityName,
  getNearestCityInfo,
  getSuggestedNearbyHospitals,
  searchIndianLocations,
  reverseGeocodeCoords,
  detectLocationFromIP,
  MAJOR_CITIES_COORDS,
  CityCoord,
} from '../utils/healthcareDirectory';
import { FormattedDoctorMessage } from './FormattedDoctorMessage';

interface ChatMessage {
  id: string;
  role: 'user' | 'doctor';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  emergencyNotice?: string;
  imagePreview?: string;
}

interface AppointmentRecord {
  id: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  doctorOrFacility: string;
  appointmentDate: string;
  appointmentTime: string;
  chiefComplaint: string;
  symptomDuration: string;
  currentMedications: string[];
  allergies: string[];
  vitals: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    bloodSugar?: string;
    spO2?: string;
  };
  clinicalDossierSummary?: string;
  createdAt: string;
}

interface DoctorPortalProps {
  currentLanguage: 'en' | 'hi' | 'hinglish';
  onNavigateToScanner?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  currentLanguage: initialLang,
  onNavigateToScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'locator' | 'appointments'>('chat');
  const [chatLanguage, setChatLanguage] = useState<'en' | 'hi' | 'hinglish'>(initialLang);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'doctor',
      text:
        chatLanguage === 'hi'
          ? `नमस्ते! मैं डॉ. आयशा (Dr. Ayesha), आपकी AI मेडिकल डॉक्टर हूँ।\n\nआप अपनी किसी भी स्वास्थ्य समस्या, दवा के दुष्प्रभाव, या लैब रिपोर्ट के बारे में मुझसे पूछ सकते हैं। आप किसी भी दवा की फोटो अपलोड करके उसकी पूरी उपयोग विधि व खुराक भी जान सकते हैं।\n\n*कृपया ध्यान दें: यदि यह कोई गंभीर आपातकाल (जैसे सीने में तेज दर्द, सांस लेने में असमर्थता) है, तो तुरंत 112 या 108 डायल करें।*`
          : `Hello! I am Dr. Ayesha, your AI Medical Doctor and Senior Clinical Advisor.\n\nHow can I help you today? You can describe any symptoms you are experiencing, ask about medication dosages/side-effects, or upload a medicine photo to get full detailed usage and safety guidelines.\n\n*Note: If you are experiencing a life-threatening emergency like severe chest pressure or shortness of breath, please immediately dial 112 or 108.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Locator State
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [detectedLocationName, setDetectedLocationName] = useState<string>('Detecting live location...');
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'detected' | 'fallback'>('detecting');
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'manual' | 'default'>('gps');
  const [suggestedHospitals, setSuggestedHospitals] = useState<HealthcareFacility[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');

  // Medicine Vision & Upload States
  const [attachedMedicineImage, setAttachedMedicineImage] = useState<string | null>(null);
  const [attachedMedicineMime, setAttachedMedicineMime] = useState<string>('image/png');
  const [attachedMedicineFileName, setAttachedMedicineFileName] = useState<string>('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const medicineFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessMedicineFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (e.g. JPG, PNG, WEBP).');
      return;
    }

    const mime = file.type || 'image/png';
    setAttachedMedicineMime(mime);
    setAttachedMedicineFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachedMedicineImage(dataUrl);
      if (!inputMessage.trim()) {
        setInputMessage(
          chatLanguage === 'hi'
            ? 'कृपया इस दवा की पहचान करें और इसके संपूर्ण उपयोग, सही खुराक और सावधानियों की जानकारी दें।'
            : 'Please identify this medicine packaging and provide complete detailed usage, dosage, timings, safety warnings, and side effects.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMedicineFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessMedicineFile(file);
  };

  const handleLoadSampleMedicine = async () => {
    try {
      const res = await fetch('/sample_crocin_strip.jpg');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedMedicineImage(dataUrl);
        setAttachedMedicineMime('image/jpeg');
        setAttachedMedicineFileName('sample_crocin_650_strip.jpg');
        setInputMessage(
          chatLanguage === 'hi'
            ? 'कृपया इस क्रोसिन 650 स्ट्रिप की पहचान करें और इसका पूरा उपयोग, वयस्क खुराक और सावधानियां बताएं।'
            : 'Please identify this Crocin 650 packaging and give complete detailed usage, dosage, food timings, safety warnings, and side effects for Khushi.'
        );
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error loading sample medicine:', err);
    }
  };

  // Appointments State
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [patientName, setPatientName] = useState('Khushi');
  const [patientAge, setPatientAge] = useState('21');
  const [patientGender, setPatientGender] = useState('Female');
  const [targetDoctor, setTargetDoctor] = useState('Dr. Balbir Singh (Cardiology), Max Super Speciality Hospital');
  const [aptDate, setAptDate] = useState('2026-10-25');
  const [aptTime, setAptTime] = useState('10:30 AM');
  const [complaint, setComplaint] = useState('Mild palpitations after morning tea and occasional lightheadedness for 10 days');
  const [duration, setDuration] = useState('10 days');
  const [medsInput, setMedsInput] = useState('Paracetamol 650mg, Vitamin D3');
  const [allergiesInput, setAllergiesInput] = useState('Penicillin');
  const [bp, setBp] = useState('122/80');
  const [pulse, setPulse] = useState('78');
  const [temp, setTemp] = useState('98.4');
  const [sugar, setSugar] = useState('95');
  const [activeDossier, setActiveDossier] = useState<AppointmentRecord | null>(null);
  const [savingApt, setSavingApt] = useState(false);

  // Load facilities on mount or filter change
  useEffect(() => {
    const list = queryHealthcareFacilities({
      query: searchQuery,
      city: cityFilter,
      specialty: specialtyFilter,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
    });
    setFacilities(list);
  }, [cityFilter, specialtyFilter, searchQuery, userLocation]);

  // Load appointments from API
  useEffect(() => {
    fetch('/api/doctor/appointments')
      .then((res) => res.json())
      .then((data) => {
        if (data.appointments) setAppointments(data.appointments);
      })
      .catch((err) => console.warn('Could not load appointments:', err));
  }, []);

  // Confine auto-scroll strictly within the chat messages box (never scrolling the outer page)
  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTo({
        top: chatMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    const imageToSend = attachedMedicineImage;
    const mimeToSend = attachedMedicineMime;

    if ((!text && !imageToSend) || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text:
        text ||
        (imageToSend
          ? 'Attached medicine packaging photo. Please identify this medicine and provide its complete detailed usage and safety instructions.'
          : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: imageToSend || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setAttachedMedicineImage(null);
    if (medicineFileInputRef.current) medicineFileInputRef.current.value = '';
    setIsTyping(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/doctor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            text ||
            'Please identify this medicine packaging and provide complete detailed usage, dosage, indications, precautions, and side effects.',
          history: historyPayload,
          language: chatLanguage,
          imageBase64: imageToSend || undefined,
          mimeType: mimeToSend || undefined,
          patientContext: {
            name: patientName,
            age: patientAge,
            gender: patientGender,
            allergies: allergiesInput.split(',').map((s) => s.trim()).filter(Boolean),
            chronicConditions: ['None reported'],
            detectedLocation: detectedLocationName,
            nearestHospitals: suggestedHospitals.map(
              (h) => `${h.name} (${h.distanceKm !== undefined ? h.distanceKm + ' km away' : h.city}) - Tel: ${h.phone}`
            ),
          },
        }),
      });

      const data = await res.json();
      const docMsg: ChatMessage = {
        id: `doc-${Date.now()}`,
        role: 'doctor',
        text: data.reply || data.fallbackReply || 'I have noted your concern.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: data.isEmergency,
        emergencyNotice: data.emergencyNotice,
      };

      setMessages((prev) => [...prev, docMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `doc-${Date.now()}`,
        role: 'doctor',
        text:
          chatLanguage === 'hi'
            ? 'क्षमा करें, इंटरनेट या सर्वर में अस्थायी समस्या है। यदि आपको तेज दर्द, सांस लेने में तकलीफ या बेचैनी है, तो कृपया तुरंत 112 पर कॉल करें।'
            : 'I am experiencing a momentary network delay. If this is an acute emergency, please contact 112 immediately or proceed to the nearest emergency ward.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const setAndSaveUserLocation = (
    coords: { lat: number; lng: number },
    displayName: string,
    source: 'gps' | 'ip' | 'manual' | 'default'
  ) => {
    setUserLocation(coords);
    setDetectedLocationName(displayName);
    setLocationStatus('detected');
    setLocationSource(source);

    try {
      localStorage.setItem(
        'mediscan_user_location',
        JSON.stringify({ coords, displayName, source })
      );
    } catch {}

    const topHospitals = getSuggestedNearbyHospitals(coords.lat, coords.lng, 3);
    setSuggestedHospitals(topHospitals);
  };

  const detectLocationAutomatically = async (forceGps = false) => {
    setLocatingUser(true);

    // If user previously selected or saved their location and we're not forcing GPS refresh
    if (!forceGps) {
      try {
        const saved = localStorage.getItem('mediscan_user_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.coords?.lat && parsed?.coords?.lng) {
            setAndSaveUserLocation(parsed.coords, parsed.displayName, parsed.source || 'manual');
            setLocatingUser(false);
            return;
          }
        }
      } catch {}
    }

    // 1. Try High-Accuracy Browser GPS First
    let gpsSuccess = false;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            enableHighAccuracy: true,
            maximumAge: 10000,
          });
        });

        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const geo = await reverseGeocodeCoords(coords.lat, coords.lng);
        const label = `${geo.fullLocation} (${coords.lat.toFixed(2)}°N, ${coords.lng.toFixed(2)}°E) - Live GPS`;
        setAndSaveUserLocation(coords, label, 'gps');
        gpsSuccess = true;
      } catch (err: any) {
        console.info('Browser GPS notice (attempting network IP geolocation fallback):', err?.message);
      }
    }

    if (gpsSuccess) {
      setLocatingUser(false);
      return;
    }

    // 2. High-Accuracy IP-Based Geolocation Fallback
    try {
      const ipData = await detectLocationFromIP();
      if (ipData && ipData.lat && ipData.lng) {
        const label = `${ipData.city}, ${ipData.region} (${ipData.lat.toFixed(2)}°N, ${ipData.lng.toFixed(2)}°E) - Network IP`;
        setAndSaveUserLocation({ lat: ipData.lat, lng: ipData.lng }, label, 'ip');
        setLocatingUser(false);
        return;
      }
    } catch (err) {
      console.warn('IP geolocation detection error:', err);
    }

    // 3. Fallback to Punjab / Regional Hub (Ludhiana) with distance calculation
    const regionalDefault = { lat: 30.901, lng: 75.8573 };
    setAndSaveUserLocation(
      regionalDefault,
      'Ludhiana, Punjab (Regional Medical Hub)',
      'default'
    );
    setLocatingUser(false);
  };

  // Run automatic location detection on initial mount
  useEffect(() => {
    detectLocationAutomatically();
  }, []);

  const handleUseLocation = () => {
    detectLocationAutomatically(true);
  };

  const handleSelectCity = (city: CityCoord) => {
    setAndSaveUserLocation(
      { lat: city.lat, lng: city.lng },
      `${city.name}, ${city.state} (Selected)`,
      'manual'
    );
    setIsLocationModalOpen(false);
    setCitySearchQuery('');
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingApt(true);

    const payload = {
      patientName,
      patientAge,
      patientGender,
      doctorOrFacility: targetDoctor,
      appointmentDate: aptDate,
      appointmentTime: aptTime,
      chiefComplaint: complaint,
      symptomDuration: duration,
      currentMedications: medsInput.split(',').map((s) => s.trim()).filter(Boolean),
      allergies: allergiesInput.split(',').map((s) => s.trim()).filter(Boolean),
      vitals: {
        bloodPressure: bp ? `${bp} mmHg` : undefined,
        pulseRate: pulse ? `${pulse} bpm` : undefined,
        temperature: temp ? `${temp} °F` : undefined,
        bloodSugar: sugar ? `${sugar} mg/dL` : undefined,
      },
    };

    try {
      const res = await fetch('/api/doctor/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.appointment) {
        setAppointments((prev) => [data.appointment, ...prev]);
        setActiveDossier(data.appointment);
      }
    } catch (err) {
      console.error('Failed to save appointment dossier:', err);
    } finally {
      setSavingApt(false);
    }
  };

  return (
    <div id="doctor-portal" className="bg-[#F6FAFD] py-10 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAF1] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FF] border border-[#1769E0]/20 text-[#1769E0] text-xs font-bold tracking-wide">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>AI CLINICAL DOCTOR &amp; HEALTHCARE PLATFORM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
              Your Complete Doctor Care Center
            </h2>
            <p className="text-sm text-[#647789] max-w-2xl leading-relaxed">
              Consult with <strong>Dr. Ayesha (AI Medical Doctor)</strong> for instant clinical triage, locate verified nearby specialists and hospitals, or generate a 1-page appointment dossier for your in-person physician.
            </p>
          </div>

          {/* Quick Emergency 112 Help Pill */}
          <div className="flex items-center gap-3">
            <a
              href="tel:112"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#C84747]/10 hover:bg-[#C84747]/20 border border-[#C84747]/30 text-[#C84747] font-bold text-xs transition-all shadow-2xs"
            >
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span>Emergency 112</span>
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#1769E0]/10 hover:bg-[#1769E0]/20 border border-[#1769E0]/30 text-[#1769E0] font-bold text-xs transition-all shadow-2xs"
            >
              <Phone className="w-4 h-4" />
              <span>Ambulance 108</span>
            </a>
          </div>
        </div>

        {/* AUTOMATIC LIVE LOCATION & SUGGESTED NEARBY HOSPITALS FOR KHUSHI */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAF1] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2EAF1] pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center font-bold shadow-xs">
                  <MapPin className="w-5 h-5 text-[#1769E0]" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#16865B] animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#16865B]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#172B3A]">
                    Nearest Hospitals for {patientName} (Age {patientAge})
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      locationSource === 'gps'
                        ? 'bg-[#16865B]/10 text-[#16865B] border-[#16865B]/20'
                        : locationSource === 'manual'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-[#1769E0]/10 text-[#1769E0] border-[#1769E0]/20'
                    }`}
                  >
                    {locatingUser
                      ? 'Detecting Location...'
                      : locationSource === 'gps'
                      ? '✓ Live GPS Active'
                      : locationSource === 'manual'
                      ? '📍 Selected Location'
                      : '📶 Network Location'}
                  </span>
                </div>
                <p className="text-xs text-[#647789] mt-0.5">
                  📍 <strong>{detectedLocationName}</strong> · Closest verified emergency &amp; specialist healthcare facilities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#1769E0] hover:bg-[#1255B8] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Change City / PIN</span>
              </button>

              <button
                type="button"
                onClick={() => detectLocationAutomatically(true)}
                disabled={locatingUser}
                title="Detect live GPS coordinates from your device"
                className="px-3.5 py-1.5 rounded-xl border border-[#1769E0]/30 hover:bg-[#EAF3FF] text-[#1769E0] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
                <span>{locatingUser ? 'Acquiring GPS...' : 'Refresh GPS'}</span>
              </button>
            </div>
          </div>

          {/* 3 Suggested Hospital Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedHospitals.map((hosp, idx) => (
              <div
                key={hosp.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#F6FAFD] to-white border border-[#E2EAF1] hover:border-[#1769E0]/40 transition-all flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#1769E0]">
                      #{idx + 1} Suggested Hospital
                    </span>
                    <span className="text-xs font-bold text-[#16865B]">
                      {hosp.distanceKm !== undefined ? `${hosp.distanceKm} km away` : 'Nearest Hub'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#172B3A] line-clamp-1">
                    {hosp.name}
                  </h4>
                  {hosp.doctorName && (
                    <p className="text-[11px] text-[#1769E0] font-semibold line-clamp-1">
                      {hosp.doctorName}
                    </p>
                  )}
                  <p className="text-[11px] text-[#647789] line-clamp-1">
                    {hosp.address}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2EAF1] flex items-center gap-2">
                  <a
                    href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 py-1.5 rounded-lg bg-[#1769E0] hover:bg-[#1255B8] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call ({hosp.phone.split('/')[0].trim()})</span>
                  </a>
                  {hosp.mapsUrl && (
                    <a
                      href={hosp.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-lg border border-[#E2EAF1] hover:border-[#1769E0] text-[#172B3A] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-[#1769E0]" />
                      <span>Directions</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-[#E2EAF1] pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20'
                  : 'bg-white text-[#647789] hover:text-[#172B3A] border border-[#E2EAF1]'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>AI Doctor Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('locator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'locator'
                  ? 'bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20'
                  : 'bg-white text-[#647789] hover:text-[#172B3A] border border-[#E2EAF1]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Find Nearby Doctors</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'appointments'
                  ? 'bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20'
                  : 'bg-white text-[#647789] hover:text-[#172B3A] border border-[#E2EAF1]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Doctor Dossier &amp; Visits</span>
            </button>
          </div>

          {activeTab === 'chat' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#647789] bg-white px-3 py-1.5 rounded-xl border border-[#E2EAF1]">
              <Languages className="w-3.5 h-3.5 text-[#1769E0]" />
              <button
                onClick={() => setChatLanguage('en')}
                className={`px-2 py-0.5 rounded ${chatLanguage === 'en' ? 'bg-[#EAF3FF] text-[#1769E0] font-bold' : ''}`}
              >
                English
              </button>
              <span>·</span>
              <button
                onClick={() => setChatLanguage('hi')}
                className={`px-2 py-0.5 rounded ${chatLanguage === 'hi' ? 'bg-[#EAF3FF] text-[#1769E0] font-bold' : ''}`}
              >
                हिंदी
              </button>
              <span>·</span>
              <button
                onClick={() => setChatLanguage('hinglish')}
                className={`px-2 py-0.5 rounded ${chatLanguage === 'hinglish' ? 'bg-[#EAF3FF] text-[#1769E0] font-bold' : ''}`}
              >
                Hinglish
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI DOCTOR CHAT                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Chat Window (8 cols) */}
            <div
              className="lg:col-span-8 bg-white rounded-3xl border border-[#E2EAF1] shadow-sm flex flex-col h-[680px] overflow-hidden relative"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessMedicineFile(file);
              }}
            >
              {/* Drag and Drop Overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-30 bg-[#1769E0]/95 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in border-4 border-dashed border-white/80 rounded-3xl">
                  <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mb-3 shadow-lg">
                    <Upload className="w-8 h-8 text-white animate-bounce" />
                  </div>
                  <h3 className="text-lg font-extrabold">Drop Medicine Packaging Photo Here</h3>
                  <p className="text-xs text-blue-100 max-w-sm mt-1">
                    Dr. Ayesha will immediately scan the blister strip / packaging and provide full usage, dosage, timings, and safety warnings for Khushi.
                  </p>
                </div>
              )}

              {/* Doctor Status Bar */}
              <div className="px-6 py-4 border-b border-[#E2EAF1] bg-gradient-to-r from-[#F6FAFD] to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1769E0] to-[#1255B8] text-white flex items-center justify-center font-bold shadow-md shadow-[#1769E0]/20">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#16865B] border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#172B3A]">Dr. Ayesha, MD</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16865B]/10 text-[#16865B] border border-[#16865B]/20">
                        AI Certified
                      </span>
                    </div>
                    <p className="text-xs text-[#647789]">Senior Clinical Advisor · Triage &amp; Medical Consultation</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: `rst-${Date.now()}`,
                        role: 'doctor',
                        text:
                          chatLanguage === 'hi'
                            ? 'परामर्श फिर से शुरू किया गया। कृपया अपनी स्वास्थ्य चिंता बताएं।'
                            : 'Consultation restarted. Please describe your health problem or question.',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ])
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2EAF1] text-xs font-semibold text-[#647789] hover:text-[#172B3A] hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Chat</span>
                </button>
              </div>

              {/* Chat Message Feed */}
              <div
                ref={chatMessagesContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                      m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                        m.role === 'user'
                          ? 'bg-[#12304A] text-white'
                          : 'bg-[#1769E0] text-white shadow-xs'
                      }`}
                    >
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Attached Medicine Specimen Photo Preview */}
                      {m.imagePreview && (
                        <div
                          className="mb-2 rounded-2xl overflow-hidden border border-[#1769E0]/30 shadow-sm max-w-[240px] bg-white group cursor-pointer relative"
                          onClick={() => setZoomedImage(m.imagePreview || null)}
                          title="Click to inspect medicine packaging in high resolution"
                        >
                          <img
                            src={m.imagePreview}
                            alt="Uploaded medicine specimen"
                            className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                            <Eye className="w-4 h-4" />
                            <span>Inspect Packaging</span>
                          </div>
                          <div className="bg-[#12304A] text-white text-[10px] font-bold px-2.5 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Pill className="w-3 h-3 text-[#18A999]" />
                              <span>Medicine Specimen</span>
                            </div>
                            <ZoomIn className="w-3 h-3 text-slate-300" />
                          </div>
                        </div>
                      )}

                      {/* Message Content: Formatted Clinical Structure for Doctor, Styled Bubble for User */}
                      {m.role === 'doctor' ? (
                        <div className="p-4 sm:p-5 rounded-2xl bg-[#F6FAFD] text-[#172B3A] border border-[#E2EAF1] rounded-tl-none shadow-2xs">
                          <FormattedDoctorMessage
                            text={m.text}
                            isEmergency={m.isEmergency}
                            emergencyNotice={m.emergencyNotice}
                            language={chatLanguage}
                            onAddToDossier={(advice) => {
                              setComplaint((prev) =>
                                prev
                                  ? `${prev}\n\n[Dr. Ayesha Advice]: ${advice.slice(0, 250)}...`
                                  : advice.slice(0, 250)
                              );
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-2xs bg-[#1769E0] text-white rounded-tr-none">
                          {m.text}
                        </div>
                      )}

                      <div
                        className={`text-[10px] text-[#647789] px-1 ${
                          m.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-3 text-xs text-[#647789] p-3.5 rounded-2xl bg-[#F6FAFD] border border-[#E2EAF1] w-fit shadow-2xs animate-pulse">
                    <Stethoscope className="w-4 h-4 text-[#1769E0] animate-spin" />
                    <span>Dr. Ayesha is analyzing clinical parameters &amp; medicine data...</span>
                  </div>
                )}
              </div>

              {/* Suggested Quick Prompts */}
              <div className="px-4 py-2.5 bg-[#F6FAFD] border-t border-[#E2EAF1] overflow-x-auto flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#647789] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#1769E0]" />
                  <span>Quick Care:</span>
                </span>
                <button
                  type="button"
                  onClick={() => medicineFileInputRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-[#1769E0] to-[#1255B8] text-white font-bold shrink-0 hover:shadow-sm transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 Upload Medicine Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleMedicine}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#EAF3FF] border border-[#1769E0]/30 text-[#1769E0] font-bold shrink-0 hover:bg-[#1769E0]/15 transition-all flex items-center gap-1"
                  title="Try analyzing a realistic Crocin 650 blister strip specimen"
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>🧪 Try Sample: Crocin 650</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Please give full detailed usage, dosage, and precautions for Allegra 120mg Tablet')}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E2EAF1] hover:border-[#1769E0] hover:text-[#1769E0] text-[#172B3A] shrink-0 transition-colors"
                >
                  💊 Allegra 120 Usage
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('I have a mild fever (100.4°F) and body ache for 2 days')}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E2EAF1] hover:border-[#1769E0] hover:text-[#1769E0] text-[#172B3A] shrink-0 transition-colors"
                >
                  🌡️ Fever &amp; Body Ache
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('What are the recommended dosage and side effects of Paracetamol 650mg?')}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E2EAF1] hover:border-[#1769E0] hover:text-[#1769E0] text-[#172B3A] shrink-0 transition-colors"
                >
                  💊 Paracetamol 650 Safety
                </button>
              </div>

              {/* Chat Input Field with Medicine Photo Upload */}
              <div className="p-4 border-t border-[#E2EAF1] bg-white space-y-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={medicineFileInputRef}
                  accept="image/*"
                  onChange={handleMedicineFileSelect}
                  className="hidden"
                />

                {/* Attached Medicine Thumbnail Preview Banner */}
                {attachedMedicineImage && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#EAF3FF] via-white to-[#F6FAFD] border-2 border-[#1769E0]/30 shadow-xs space-y-2 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative group cursor-pointer shrink-0"
                        onClick={() => setZoomedImage(attachedMedicineImage)}
                        title="Click to inspect medicine packaging in high resolution"
                      >
                        <img
                          src={attachedMedicineImage}
                          alt="Attached medicine packaging"
                          className="w-14 h-14 object-cover rounded-xl border border-[#1769E0]/20 shadow-xs group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#172B3A] truncate">
                            {attachedMedicineFileName || 'Medicine Packaging Specimen Attached'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16865B]/10 text-[#16865B] border border-[#16865B]/20">
                            Ready to Analyze
                          </span>
                        </div>
                        <p className="text-[11px] text-[#647789] truncate mt-0.5">
                          Dr. Ayesha will examine the packaging and provide complete indications, adult dosage, timings &amp; safety warnings.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedMedicineImage(null);
                          setAttachedMedicineFileName('');
                          if (medicineFileInputRef.current) medicineFileInputRef.current.value = '';
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#C84747] hover:bg-white transition-colors"
                        title="Remove attached photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Action Suggestion Chips for the attached medicine */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#1769E0]/15">
                      <span className="text-[10px] font-bold text-[#647789] uppercase">Choose Question:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setInputMessage('Please identify this medicine packaging and provide complete detailed usage, dosage, timings, safety warnings, and side effects.')
                        }
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#1769E0]/30 hover:bg-[#1769E0] hover:text-white text-[#1769E0] font-semibold transition-colors shadow-2xs"
                      >
                        💊 Full Usage &amp; Dosage Guide
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setInputMessage('What are the essential precautions, contraindications, schedule status, and side effects for this medicine?')
                        }
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-500 hover:text-white text-amber-700 font-semibold transition-colors shadow-2xs"
                      >
                        ⚠️ Safety &amp; Side Effects
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatLanguage('hi');
                          setInputMessage('कृपया इस दवा की पहचान, उपयोग विधि, सही खुराक और सावधानियां हिंदी में विस्तार से बताएं।');
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-600 hover:text-white text-emerald-700 font-semibold transition-colors shadow-2xs"
                      >
                        🇮🇳 हिंदी में संपूर्ण उपयोग
                      </button>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Upload Medicine Button */}
                  <button
                    type="button"
                    onClick={() => medicineFileInputRef.current?.click()}
                    className={`px-3 py-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                      attachedMedicineImage
                        ? 'bg-[#1769E0] text-white border-[#1769E0] shadow-xs'
                        : 'bg-[#F6FAFD] hover:bg-[#EAF3FF] text-[#1769E0] border-[#E2EAF1] hover:border-[#1769E0]/30'
                    }`}
                    title="Upload Medicine Packaging Photo"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {attachedMedicineImage ? 'Photo Ready' : 'Upload Medicine'}
                    </span>
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      attachedMedicineImage
                        ? 'Add custom query or click Send to analyze full usage...'
                        : chatLanguage === 'hi'
                        ? 'अपने लक्षण या दवा के बारे में यहाँ लिखें, या दवा की फोटो अपलोड करें...'
                        : 'Describe symptoms or upload a medicine photo for full usage details...'
                    }
                    className="flex-1 px-4 py-3 bg-[#F6FAFD] border border-[#E2EAF1] focus:border-[#1769E0] focus:bg-white rounded-xl text-sm text-[#172B3A] focus:outline-none transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && !attachedMedicineImage) || isTyping}
                    className="px-5 py-3 rounded-xl bg-[#1769E0] hover:bg-[#1255B8] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-[#1769E0]/20 transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Patient Profile & Safety Guide (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Patient Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E2EAF1] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#172B3A] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1769E0]" />
                    <span>Consulting Patient Profile</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769E0]">
                    Active
                  </span>
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#E2EAF1]">
                    <span className="text-[#647789]">Patient Name:</span>
                    <span className="font-bold text-[#172B3A]">{patientName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E2EAF1]">
                    <span className="text-[#647789]">Age / Gender:</span>
                    <span className="font-bold text-[#172B3A]">
                      {patientAge} Yrs / {patientGender}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E2EAF1]">
                    <span className="text-[#647789]">Known Allergies:</span>
                    <span className="font-bold text-[#C84747]">{allergiesInput}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#647789]">Current Vitals:</span>
                    <span className="font-bold text-[#16865B]">BP {bp} · Pulse {pulse}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className="w-full py-2.5 rounded-xl border border-[#1769E0]/30 hover:bg-[#EAF3FF]/40 text-[#1769E0] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Update Profile &amp; Vitals</span>
                </button>
              </div>

              {/* Doctor Consultation Disclaimer Card */}
              <div className="bg-gradient-to-br from-[#EAF3FF]/60 to-white rounded-3xl p-6 border border-[#1769E0]/20 space-y-3">
                <div className="flex items-center gap-2 text-[#1769E0] text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Safe AI Clinical Practice</span>
                </div>
                <p className="text-xs text-[#647789] leading-relaxed">
                  Dr. Ayesha evaluates clinical symptoms against established national guidelines and Indian pharmacopoeia standards. Emergency red flags automatically trigger life-safety protocols.
                </p>
                <div className="pt-2 border-t border-[#1769E0]/15 flex items-center justify-between text-[11px] font-semibold text-[#1769E0]">
                  <span>National Emergency Code</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-[#1769E0]/30">
                    112 / 108
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FIND NEARBY DOCTORS & CLINICS (LOCATOR)                            */}
        {/* ========================================================================= */}
        {activeTab === 'locator' && (
          <div className="space-y-6">
            {/* Filter Controls Bar */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2EAF1] shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Bar */}
                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Search Doctor or Hospital</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. AIIMS, Cardiologist, Fortis..."
                    className="w-full px-3.5 py-2.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                  />
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Filter by City / Region</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0] text-[#172B3A] font-semibold"
                  >
                    <option value="all">All Cities (Sorted by Distance from You)</option>
                    <option value="Ludhiana">Ludhiana (Punjab)</option>
                    <option value="Chandigarh">Chandigarh / Tricity</option>
                    <option value="Mohali">Mohali (Punjab)</option>
                    <option value="Jalandhar">Jalandhar (Punjab)</option>
                    <option value="Amritsar">Amritsar (Punjab)</option>
                    <option value="Patiala">Patiala (Punjab)</option>
                    <option value="Bathinda">Bathinda (Punjab)</option>
                    <option value="New Delhi">New Delhi / Central NCR</option>
                    <option value="Gurugram">Gurugram (Haryana)</option>
                    <option value="Mumbai">Mumbai (Maharashtra)</option>
                    <option value="Bengaluru">Bengaluru (Karnataka)</option>
                  </select>
                </div>

                {/* Specialty Filter */}
                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Specialty</label>
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0] text-[#172B3A] font-semibold"
                  >
                    <option value="all">All Specialties</option>
                    <option value="General Medicine">General Medicine / Physician</option>
                    <option value="Cardiology">Cardiology (Heart)</option>
                    <option value="Neurology">Neurology (Brain &amp; Nerves)</option>
                    <option value="Pediatrics">Pediatrics (Child Care)</option>
                    <option value="Orthopaedics">Orthopaedics (Bone &amp; Joint)</option>
                    <option value="Dermatology">Dermatology (Skin)</option>
                    <option value="Emergency Medicine">24x7 Emergency / Trauma</option>
                    <option value="Diagnostic Pathology">Diagnostic Lab</option>
                  </select>
                </div>

                {/* Location Quick Switch Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1769E0] hover:bg-[#1255B8] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change City</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={locatingUser}
                    title="Detect device GPS"
                    className="py-2.5 px-3 rounded-xl bg-[#EAF3FF] hover:bg-[#1769E0] hover:text-white text-[#1769E0] border border-[#1769E0]/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
                    <span>GPS</span>
                  </button>
                </div>
              </div>

              {userLocation && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#16865B]/10 border border-[#16865B]/20 text-[#16865B] text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865B]" />
                    <span>
                      Active location: <strong>{detectedLocationName}</strong>. Showing verified facilities ordered by nearest travel distance.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-xs font-bold text-[#1769E0] hover:underline shrink-0"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Facilities Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-white rounded-3xl p-6 border border-[#E2EAF1] hover:border-[#1769E0]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20">
                        {fac.facilityType}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#C78319]">
                        <span>⭐</span>
                        <span>{fac.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-[#172B3A] line-clamp-1">
                        {fac.name}
                      </h4>
                      {fac.doctorName && (
                        <p className="text-xs font-bold text-[#1769E0] mt-0.5">
                          {fac.doctorName}
                        </p>
                      )}
                      {fac.doctorQualification && (
                        <p className="text-[11px] text-[#647789] italic">
                          {fac.doctorQualification}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-xs text-[#647789]">
                      <MapPin className="w-3.5 h-3.5 text-[#1769E0] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{fac.address}</span>
                    </div>

                    {fac.distanceKm !== undefined && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[#172B3A] text-[11px] font-bold">
                        <span>Distance:</span>
                        <span className="text-[#1769E0]">{fac.distanceKm} km away</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {fac.specialties.slice(0, 3).map((spec, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F6FAFD] border border-[#E2EAF1] text-[#647789]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2EAF1] flex items-center gap-2">
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex-1 py-2 rounded-xl bg-[#EAF3FF] hover:bg-[#1769E0] hover:text-white text-[#1769E0] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Doctor</span>
                    </a>
                    {fac.mapsUrl && (
                      <a
                        href={fac.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl border border-[#E2EAF1] hover:border-[#1769E0] text-[#172B3A] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#1769E0]" />
                        <span>Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {facilities.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-[#E2EAF1] p-8 space-y-3">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-[#172B3A]">No medical facilities found</h4>
                <p className="text-xs text-[#647789] max-w-sm mx-auto">
                  Try broadening your city or specialty filter to view available hospitals and clinics.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DOCTOR APPOINTMENTS & CLINICAL DOSSIERS                              */}
        {/* ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Appointment Preparation Form (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAF1] shadow-sm space-y-5">
              <div className="border-b border-[#E2EAF1] pb-3">
                <h3 className="text-lg font-extrabold text-[#172B3A]">Prepare Doctor Visit Dossier</h3>
                <p className="text-xs text-[#647789]">
                  Generate a structured 1-page clinical summary to hand directly to your doctor.
                </p>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-[#172B3A] mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#172B3A] mb-1">Age / Gender</label>
                    <input
                      type="text"
                      value={`${patientAge} / ${patientGender}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        if (parts[0]) setPatientAge(parts[0].trim());
                        if (parts[1]) setPatientGender(parts[1].trim());
                      }}
                      className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Doctor or Clinic</label>
                  <input
                    type="text"
                    value={targetDoctor}
                    onChange={(e) => setTargetDoctor(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#172B3A] mb-1">Appointment Date</label>
                    <input
                      type="date"
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#172B3A] mb-1">Time</label>
                    <input
                      type="text"
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Chief Health Complaints</label>
                  <textarea
                    rows={2}
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Describe main symptoms (e.g. fever, headache, back pain)..."
                    required
                    className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#172B3A] mb-1">Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 5 days, 2 weeks"
                      className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#172B3A] mb-1">Known Allergies</label>
                    <input
                      type="text"
                      value={allergiesInput}
                      onChange={(e) => setAllergiesInput(e.target.value)}
                      placeholder="e.g. Penicillin, Sulfa"
                      className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Current Medicines</label>
                  <input
                    type="text"
                    value={medsInput}
                    onChange={(e) => setMedsInput(e.target.value)}
                    placeholder="e.g. Paracetamol 650mg, Telmisartan 40mg"
                    className="w-full px-3.5 py-2 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0]"
                  />
                </div>

                {/* Vitals row */}
                <div>
                  <label className="block text-xs font-bold text-[#172B3A] mb-1">Recent Vitals (Optional)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="BP (120/80)"
                      className="px-2.5 py-1.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      placeholder="Pulse (72)"
                      className="px-2.5 py-1.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      placeholder="Temp (°F)"
                      className="px-2.5 py-1.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={sugar}
                      onChange={(e) => setSugar(e.target.value)}
                      placeholder="Sugar (mg/dL)"
                      className="px-2.5 py-1.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingApt}
                  className="w-full py-3 bg-[#1769E0] hover:bg-[#1255B8] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#1769E0]/20 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingApt ? 'Saving Dossier...' : 'Generate Clinical Dossier for Doctor'}</span>
                </button>
              </form>
            </div>

            {/* Right: Dossier Preview & Scheduled Visits (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {activeDossier || appointments.length > 0 ? (
                (() => {
                  const dossier = activeDossier || appointments[0];
                  return (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#1769E0]/30 shadow-sm space-y-5 print:shadow-none">
                      <div className="flex items-center justify-between border-b border-[#E2EAF1] pb-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-[#1769E0]" />
                          <h4 className="text-base font-extrabold text-[#172B3A]">
                            Clinical Patient Dossier
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1769E0]/30 text-[#1769E0] text-xs font-bold hover:bg-[#EAF3FF] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Dossier</span>
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Patient & Clinic Metadata */}
                        <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-[#F6FAFD] border border-[#E2EAF1]">
                          <div>
                            <span className="text-[#647789] block text-[11px]">Patient Name:</span>
                            <span className="font-extrabold text-[#172B3A] text-sm">
                              {dossier.patientName}
                            </span>
                            <span className="text-[#647789] block mt-0.5">
                              {dossier.patientAge} Years · {dossier.patientGender}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#647789] block text-[11px]">Attending Doctor / Clinic:</span>
                            <span className="font-bold text-[#172B3A] line-clamp-1">
                              {dossier.doctorOrFacility}
                            </span>
                            <span className="text-[#1769E0] font-semibold block mt-0.5">
                              {dossier.appointmentDate} at {dossier.appointmentTime}
                            </span>
                          </div>
                        </div>

                        {/* Chief Complaints */}
                        <div>
                          <span className="font-bold text-[#172B3A] block mb-1">
                            Chief Complaints &amp; Onset:
                          </span>
                          <div className="p-3 rounded-xl bg-white border border-[#E2EAF1] text-[#172B3A] font-medium leading-relaxed">
                            {dossier.chiefComplaint}
                            <span className="text-[#647789] block text-[11px] mt-1">
                              Duration: <strong>{dossier.symptomDuration}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Vitals Summary */}
                        <div>
                          <span className="font-bold text-[#172B3A] block mb-1">Recorded Vitals:</span>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1]">
                              <span className="text-[10px] text-[#647789] block">BP</span>
                              <span className="font-bold text-[#172B3A]">{dossier.vitals?.bloodPressure || '120/80'}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1]">
                              <span className="text-[10px] text-[#647789] block">Pulse</span>
                              <span className="font-bold text-[#172B3A]">{dossier.vitals?.pulseRate || '78 bpm'}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1]">
                              <span className="text-[10px] text-[#647789] block">Temp</span>
                              <span className="font-bold text-[#172B3A]">{dossier.vitals?.temperature || '98.4°F'}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1]">
                              <span className="text-[10px] text-[#647789] block">Sugar</span>
                              <span className="font-bold text-[#172B3A]">{dossier.vitals?.bloodSugar || '95 mg/dL'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Medications & Allergies */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1]">
                            <span className="text-[11px] font-bold text-[#172B3A] block mb-1">
                              Current Medications:
                            </span>
                            <span className="text-[#647789]">
                              {dossier.currentMedications.join(', ') || 'None reported'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-[#C84747]/5 border border-[#C84747]/20">
                            <span className="text-[11px] font-bold text-[#C84747] block mb-1">
                              Known Drug Allergies:
                            </span>
                            <span className="font-bold text-[#C84747]">
                              {dossier.allergies.join(', ') || 'No known drug allergies (NKDA)'}
                            </span>
                          </div>
                        </div>

                        {/* Notes for Doctor */}
                        <div className="p-3 rounded-xl border border-dashed border-slate-300 text-[11px] text-[#647789]">
                          <span className="font-bold text-[#172B3A] block mb-0.5">Notes for Attending Physician:</span>
                          Generated via Mediscan AI Clinical Platform. Intended to expedite clinical history-taking.
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-[#E2EAF1] p-8 space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-[#172B3A]">No Dossier Created Yet</h4>
                  <p className="text-xs text-[#647789] max-w-sm mx-auto">
                    Fill out the consultation form on the left to generate your printable doctor visit dossier.
                  </p>
                </div>
              )}

              {/* Past Appointments List */}
              {appointments.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-[#E2EAF1] shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                    Scheduled Doctor Visits ({appointments.length})
                  </h4>
                  <div className="space-y-2">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => setActiveDossier(apt)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          activeDossier?.id === apt.id
                            ? 'bg-[#EAF3FF] border-[#1769E0]'
                            : 'bg-[#F6FAFD] border-[#E2EAF1] hover:border-[#1769E0]/40'
                        }`}
                      >
                        <div>
                          <h5 className="text-xs font-bold text-[#172B3A]">{apt.doctorOrFacility}</h5>
                          <p className="text-[11px] text-[#647789]">
                            {apt.appointmentDate} · {apt.appointmentTime}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#1769E0]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lightbox / Zoom Modal for inspecting high-res medicine packaging */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setZoomedImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#1769E0]" />
                  <span className="text-xs font-bold text-[#172B3A]">
                    Medicine Packaging Photo Inspection · Patient Khushi (Age 21)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl m-1">
                <img
                  src={zoomedImage}
                  alt="High resolution medicine packaging"
                  className="max-h-[70vh] w-auto rounded-xl object-contain shadow-sm"
                />
              </div>
              <div className="px-4 py-2 bg-white flex items-center justify-between text-[11px] text-[#647789]">
                <span>Inspecting active salts, dosage, and manufacturer warnings</span>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#172B3A] font-bold text-xs transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE CITY & LOCATION SELECTOR MODAL */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E2EAF1] space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#E2EAF1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#172B3A]">
                      Select Your Location / शहर चुनें
                    </h3>
                    <p className="text-xs text-[#647789]">
                      Distances to emergency hospitals and doctors are calculated from here.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="Type city name, district, or PIN code (e.g. Ludhiana, Mohali, Patiala, 141001)..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-xs focus:outline-none focus:border-[#1769E0] text-[#172B3A] font-medium"
                />
              </div>

              {/* Quick One-Tap Popular Cities */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#647789]">
                  Popular Regional Medical Hubs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573 },
                    { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
                    { name: 'Mohali', state: 'Punjab', lat: 30.7046, lng: 76.7179 },
                    { name: 'Jalandhar', state: 'Punjab', lat: 31.326, lng: 75.5762 },
                    { name: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723 },
                    { name: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869 },
                    { name: 'Bathinda', state: 'Punjab', lat: 30.211, lng: 74.9455 },
                    { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
                    { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
                    { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
                    { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
                    { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F6FAFD] hover:bg-[#1769E0] hover:text-white border border-[#E2EAF1] transition-all"
                    >
                      📍 {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching Search Results */}
              <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 border border-[#E2EAF1] rounded-2xl">
                {searchIndianLocations(citySearchQuery).map((c) => (
                  <button
                    key={`${c.name}-${c.state}`}
                    type="button"
                    onClick={() => handleSelectCity(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#EAF3FF] flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#172B3A] group-hover:text-[#1769E0]">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-[#647789]">
                        {c.state} · PIN {c.pincodePrefix || 'N/A'}xxx
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#1769E0] group-hover:translate-x-0.5 transition-transform">
                      Select →
                    </span>
                  </button>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-[#E2EAF1] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLocationModalOpen(false);
                    detectLocationAutomatically(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#EAF3FF] hover:bg-[#1769E0] hover:text-white text-[#1769E0] text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Detect Device GPS Instead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

