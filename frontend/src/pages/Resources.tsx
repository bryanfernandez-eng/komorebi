import { useEffect, useState } from 'react';
import { Clock, Phone, MapPin, AlertCircle, Sunrise } from 'lucide-react';
import { getUsfResources } from '../api';

interface UsfResources {
  general_hours: string;
  urgent_hours: string;
  crisis_hotline: string;
  location: string;
  after_hours_instructions: string;
}

export default function Resources() {
  const [data, setData] = useState<UsfResources | null>(null);

  useEffect(() => {
    getUsfResources()
      .then(setData)
      .catch((err) => console.error('Failed to load resources', err));
  }, []);

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center opacity-50 text-[#4E6E4C]">
           <Sunrise className="w-6 h-6 animate-pulse mb-3" />
           <span className="text-[13px] font-medium tracking-wide">Loading campus resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#FBF7EC] flex justify-center p-6 pt-10">
      <div className="w-full max-w-2xl space-y-6">

        {/* Hero Card */}
        <div className="bg-[#F4EFE6] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-[#EAE2D0]">
          <div className="mb-6">
            <h1 className="text-[28px] font-bold text-[#304E2F] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
              USF Counseling Center
            </h1>
            <p className="text-[14px] text-[#4E6E4C] italic">
              Professional, confidential mental health services for enrolled students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            
            <div className="bg-[#FBF7EC] rounded-2xl p-5 border border-[#D1CAA9] flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                 <Phone className="w-4 h-4 text-[#B69265]" />
                 <span className="text-[11px] font-bold uppercase tracking-widest text-[#B69265]">Crisis Hotline</span>
              </div>
              <div className="text-[20px] font-bold text-[#304E2F]">{data.crisis_hotline}</div>
              <p className="text-[12px] text-[#4E6E4C] mt-2 leading-relaxed">
                Available 24/7. After hours, press option 3 to speak with a licensed professional.
              </p>
            </div>

            <div className="bg-[#FBF7EC] rounded-2xl p-5 border border-[#D1CAA9] flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                 <AlertCircle className="w-4 h-4 text-[#A8C99A]" />
                 <span className="text-[11px] font-bold uppercase tracking-widest text-[#4E6E4C]">Urgent Drop-in</span>
              </div>
              <div className="text-[14px] font-bold text-[#304E2F] leading-snug">{data.urgent_hours}</div>
              <p className="text-[12px] text-[#4E6E4C] mt-1 leading-relaxed">
                First-come, first-served triage for immediate mental health support.
              </p>
            </div>

          </div>
        </div>

        {/* Detailed Info List */}
        <div className="bg-white rounded-2xl p-6 border border-[#D1CAA9] space-y-5 shadow-sm">
          
          <div className="flex items-start gap-4 pb-5 border-b border-[#EAE2D0]">
             <div className="w-10 h-10 rounded-full bg-[#F4EFE6] flex items-center justify-center flex-shrink-0">
               <Clock className="w-5 h-5 text-[#304E2F]" />
             </div>
             <div>
               <h3 className="text-[15px] font-bold text-[#304E2F] mb-1">General Office Hours</h3>
               <p className="text-[13px] text-[#4E6E4C]">{data.general_hours}</p>
             </div>
          </div>

          <div className="flex items-start gap-4 pb-5 border-b border-[#EAE2D0]">
             <div className="w-10 h-10 rounded-full bg-[#F4EFE6] flex items-center justify-center flex-shrink-0">
               <MapPin className="w-5 h-5 text-[#304E2F]" />
             </div>
             <div>
               <h3 className="text-[15px] font-bold text-[#304E2F] mb-1">Location</h3>
               <p className="text-[13px] text-[#4E6E4C]">{data.location}</p>
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-full bg-[#F4EFE6] flex items-center justify-center flex-shrink-0">
               <Sunrise className="w-5 h-5 text-[#304E2F]" />
             </div>
             <div>
               <h3 className="text-[15px] font-bold text-[#304E2F] mb-1">After-Hours Protocol</h3>
               <p className="text-[13px] text-[#4E6E4C] leading-relaxed">{data.after_hours_instructions}</p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
