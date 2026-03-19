"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toPng } from "html-to-image";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formSchema = z.object({
  servantName: z.string().min(1, "مطلوب"),
  todayDate: z.string().min(1, "مطلوب"),
  fullName: z.string().min(1, "الاسم الرباعي مطلوب"),
  dob: z.string().min(1, "مطلوب"),
  homePhone: z.string().optional(),
  mobile1: z.string().min(11, "يجب أن يكون 11 رقم").max(11, "يجب أن يكون 11 رقم"),
  mobile2: z.string().optional(),
  maritalStatus: z.string().nullable().refine((val) => val !== null && val.trim() !== "", { message: "مطلوب" }),
  addressBuilding: z.string().min(1, "مطلوب"),
  addressStreet: z.string().min(1, "مطلوب"),
  addressFloor: z.string().optional(),
  addressApt: z.string().optional(),
  addressArea: z.string().min(1, "مطلوب"),
  addressLandmark: z.string().optional(),
  siblingsName: z.string().optional(),
  siblingsMobile: z.string().optional(),
  educationStatus: z.string().nullish(),
  university: z.string().optional(),
  college: z.string().optional(),
  workStatus: z.string().nullish(),
  jobTitle: z.string().optional(),
  confessionFather: z.string().optional(),
  servesOtherChurch: z.string().nullish(),
  attendedChurch: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ChurchForm() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      todayDate: "",
    },
  });

  const [modalImage, setModalImage] = useState<string | null>(null);

  // Removed success auto-hide since we use a modal now

  const eduStatus = watch("educationStatus");

  const onSubmit = async (data: FormValues) => {
    if (!formRef.current) return;
    try {
      setIsExporting(true);
      
      formRef.current.classList.add("force-desktop-export");
      const originalWidth = formRef.current.style.width;
      formRef.current.style.width = '850px';
      
      const dataUrl = await toPng(formRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
          boxShadow: 'none',
        }
      });
      
      formRef.current.classList.remove("force-desktop-export");
      formRef.current.style.width = originalWidth;

      // Ensure the image loaded fallback state
      if (dataUrl) {
         setModalImage(dataUrl);
      }
    } catch (err: any) {
      console.error("Failed to export image", err);
      alert("حدث خطأ أثناء حفظ الصورة: " + (err?.message || "مجهول"));
    } finally {
      setIsExporting(false);
    }
  };

  const onError = (formErrors: any) => {
    console.log("Validation failed", formErrors);
    let errorMessages = [];
    for (const key in formErrors) {
       errorMessages.push(`- ${key}: ${formErrors[key].message}`);
    }
    alert("برجاء إكمال الحقول المطلوبة:\n" + errorMessages.join("\n"));
  };

  const handleShare = async () => {
    if (!modalImage) return;
    try {
      const res = await fetch(modalImage);
      const blob = await res.blob();
      const file = new File([blob], 'estemara.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'إستمارة بيانات',
        });
      } else {
        // Fallback to auto download
        const link = document.createElement('a');
        link.download = 'estemara.png';
        link.href = modalImage;
        link.click();
      }
    } catch(err) {
      console.log("Share failed or canceled", err);
    }
  };

  const ErrorMsg = ({ msg }: { msg?: string }) => {
    if (!msg) return null;
    return <span className="text-red-500 text-xs absolute -bottom-4 right-0 font-normal">{msg}</span>;
  };

  const InputWrap = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("relative flex items-center gap-2", className)}>
      {children}
    </div>
  );

  return (
    <div className="w-full flex justify-center pb-20">
      <style>{`
        .force-desktop-export {
          width: 850px !important;
          max-width: none !important;
        }
        .force-desktop-export .sm\\:flex-row {
          flex-direction: row !important;
        }
        .force-desktop-export .sm\\:items-center {
          align-items: center !important;
        }
      `}</style>
      <div 
        ref={formRef} 
        className="w-full max-w-[850px] bg-white p-4 sm:p-12 relative border-4 border-white transition-all overflow-hidden"
        style={{ direction: 'rtl' }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">إستمارة بيانات</h1>
        </div>

        <div className="border-t-4 border-black mb-1"></div>
        <div className="border-t-[2px] border-black mb-6"></div>

        <form className="space-y-6 sm:space-y-8 text-sm sm:text-base font-bold text-black" onSubmit={(e) => e.preventDefault()} id="churchForm">
          {/* Row 1 */}
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <InputWrap className="flex-1 w-full min-w-0">
              <label className="whitespace-nowrap shrink-0">تاريخ اليوم :</label>
              <input type="date" {...register("todayDate")} className="flex-1 w-full min-w-0 border-b-2 border-dotted border-black bg-transparent focus:outline-none appearance-none" />
              <ErrorMsg msg={errors.todayDate?.message} />
            </InputWrap>
            <InputWrap className="flex-1">
              <label className="whitespace-nowrap flex items-center gap-2">
                أسم الخادم <span>/</span> ة :
              </label>
              <input type="text" {...register("servantName")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none text-center" />
              <ErrorMsg msg={errors.servantName?.message} />
            </InputWrap>
          </div>

          <div className="text-center text-xs sm:text-sm bg-white py-1 border-y-2 border-black">
            " رجاء ملء البيانات التاليه بخط واضح "
          </div>

          {/* Row 2 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="whitespace-nowrap sm:self-center">الأسم رباعي :</label>
            <div className="flex-1 relative w-full">
              <input type="text" {...register("fullName")} className="w-full border-2 border-black p-2 bg-transparent focus:outline-none h-12" />
              <ErrorMsg msg={errors.fullName?.message} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full">
            <div className="flex-1 flex flex-col sm:flex-row sm:gap-4 lg:pr-1 relative min-w-0">
              <label className="whitespace-nowrap mb-2 sm:mb-0 sm:self-center shrink-0">تاريخ الميلاد :</label>
              <input type="date" {...register("dob")} className="flex-1 w-full min-w-0 border-2 border-black p-2 bg-transparent focus:outline-none h-12 appearance-none" />
              <ErrorMsg msg={errors.dob?.message} />
            </div>
            <InputWrap className="flex-[0.8]">
              <label className="whitespace-nowrap">تليفون المنزل :</label>
              <input type="tel" {...register("homePhone")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none font-mono tracking-widest leading-loose" />
            </InputWrap>
          </div>

          {/* Row 4 */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full">
            <div className="flex-1 flex flex-col sm:flex-row sm:gap-4 lg:pr-1 relative">
              <label className="whitespace-nowrap mb-2 sm:mb-0 sm:self-center">الموبيل :</label>
              <input type="tel" {...register("mobile1")} className="flex-1 w-full border-2 border-black p-2 tracking-[0.3em] font-mono bg-transparent focus:outline-none text-center h-12" maxLength={11} />
              <ErrorMsg msg={errors.mobile1?.message} />
            </div>
            <div className="flex-[0.8] flex flex-col sm:flex-row sm:gap-4 lg:pr-1 relative">
               <label className="whitespace-nowrap mb-2 sm:mb-0 sm:self-center">الموبيل :</label>
              <input type="tel" {...register("mobile2")} className="flex-1 w-full border-2 border-black p-2 tracking-[0.3em] font-mono bg-transparent focus:outline-none text-center h-12" maxLength={11} />
            </div>
          </div>

          {/* Row 5 - Marital Status */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-2">
            <span className="whitespace-nowrap">الحاله الاجتماعيه :</span>
            {(["أعزب / ة", "متزوج / ة", "أرمل / ة", "مطلق / ة"] as const).map((status) => (
              <label key={status} className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input type="radio" value={status} {...register("maritalStatus")} className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black appearance-none checked:bg-black checked:border-white ring-2 ring-black" />
                <span className="text-sm sm:text-base">{status}</span>
              </label>
            ))}
            <div className="relative w-full h-0">
               <ErrorMsg msg={errors.maritalStatus?.message} />
            </div>
          </div>

          {/* Row 6 - Address */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 w-full">
            <span className="whitespace-nowrap w-full sm:w-auto">العنوان :</span>
            <InputWrap className="w-1/3 sm:w-32 flex-col sm:flex-row items-start sm:items-center">
              <label className="text-sm shrink-0">رقم العقار :</label>
              <input type="text" {...register("addressBuilding")} className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none" />
              <ErrorMsg msg={errors.addressBuilding?.message} />
            </InputWrap>
            <InputWrap className="flex-1 min-w-[150px] flex-col sm:flex-row items-start sm:items-center">
              <label className="text-sm shrink-0">أسم الشارع :</label>
              <input type="text" {...register("addressStreet")} className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none" />
              <ErrorMsg msg={errors.addressStreet?.message} />
            </InputWrap>
            <InputWrap className="w-1/4 sm:w-24 flex-col sm:flex-row items-start sm:items-center">
              <label className="text-sm shrink-0">دور :</label>
              <input type="text" {...register("addressFloor")} className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none" />
            </InputWrap>
            <InputWrap className="w-1/4 sm:w-24 flex-col sm:flex-row items-start sm:items-center">
              <label className="text-sm shrink-0">شقه :</label>
              <input type="text" {...register("addressApt")} className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none" />
            </InputWrap>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-2">
            <InputWrap className="flex-1 w-full justify-start items-center">
              <label className="whitespace-nowrap sm:pr-[4.5rem]">المنطقة :</label>
              <input type="text" {...register("addressArea")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none leading-loose" />
              <ErrorMsg msg={errors.addressArea?.message} />
            </InputWrap>
            <InputWrap className="flex-1 w-full justify-start items-center">
              <label className="whitespace-nowrap">علامه مميزة للعنوان :</label>
              <input type="text" {...register("addressLandmark")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none leading-loose" />
            </InputWrap>
          </div>

          <div className="text-center text-xs sm:text-sm bg-white py-1 border-y-2 border-black mt-8">
            " ليس من الضروري استكمال البيانات التاليه اذا كان سن المخدوم فوق 32 سنه "
          </div>

          {/* Row 8 - Siblings */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mt-8">
            <div className="flex-[1.5] w-full flex flex-col sm:flex-row sm:gap-4 lg:pr-1">
              <label className="whitespace-nowrap mb-2 sm:mb-0 sm:self-center">إخوة و أخوات :</label>
              <input type="text" {...register("siblingsName")} className="flex-1 w-full border-2 border-black p-2 bg-transparent h-12 focus:outline-none" />
            </div>
            <div className="flex-1 w-full flex flex-col sm:flex-row sm:gap-4 lg:pr-1">
              <label className="whitespace-nowrap mb-2 sm:mb-0 sm:self-center">الموبيل :</label>
              <input type="tel" {...register("siblingsMobile")} className="flex-1 w-full border-b-2 border-dotted border-black font-mono tracking-widest text-center focus:outline-none leading-loose" maxLength={11} />
            </div>
          </div>

          {/* Row 9 - Education & Work */}
          <div className="flex flex-col gap-6 mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
              <label className="flex items-center gap-3 cursor-pointer w-auto sm:w-24 shrink-0">
                <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                    <input type="radio" value="طالب" {...register("educationStatus")} className="opacity-0 absolute inset-0 cursor-pointer peer" />
                    <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                </span>
                <span>طالب</span>
              </label>
              <div className={cn("flex-1 flex flex-col sm:flex-row w-full gap-4 transition-opacity", eduStatus !== "طالب" && "opacity-40 pointer-events-none")}>
                <InputWrap className="flex-1">
                  <span className="whitespace-nowrap">جامعه :</span>
                  <input type="text" {...register("university")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none leading-loose" />
                </InputWrap>
                <InputWrap className="flex-1">
                  <span className="whitespace-nowrap">كلية :</span>
                  <input type="text" {...register("college")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none leading-loose" />
                </InputWrap>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
               <label className="flex items-center gap-3 cursor-pointer w-auto sm:w-24 shrink-0">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input type="radio" value="خريج" {...register("educationStatus")} className="opacity-0 absolute inset-0 cursor-pointer peer" />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                  </span>
                  <span>خريج</span>
                </label>
              
               <div className={cn("flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 transition-opacity w-full", eduStatus !== "خريج" && "opacity-40 pointer-events-none")}>
                 <div className="flex items-center gap-6 shrink-0">
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                     <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                        <input type="radio" value="يعمل" {...register("workStatus")} className="opacity-0 absolute inset-0 cursor-pointer peer" />
                        <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                    </span>
                    <span>يعمل</span>
                  </label>
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                     <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                        <input type="radio" value="لايعمل" {...register("workStatus")} className="opacity-0 absolute inset-0 cursor-pointer peer" />
                        <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                    </span>
                    <span>لايعمل</span>
                  </label>
                 </div>
                 
                 <InputWrap className="flex-1 w-full lg:pr-8">
                    <span className="whitespace-nowrap shrink-0">الوظيفة :</span>
                    <input type="text" {...register("jobTitle")} className="flex-1 border-b-2 border-dotted border-black bg-transparent focus:outline-none w-full leading-loose" />
                  </InputWrap>
               </div>
            </div>
          </div>

          {/* Row 10 - Church Info */}
          <div className="flex flex-col sm:flex-row gap-6 mt-6 items-start sm:items-center">
            <InputWrap className="flex-[1.5] w-full flex-col sm:flex-row items-start sm:items-center">
              <label className="whitespace-nowrap pr-2 w-full sm:w-auto mb-2 sm:mb-0">أب الاعتراف :</label>
              <input type="text" {...register("confessionFather")} className="flex-1 w-full sm:w-auto border-b-2 border-dotted border-black bg-transparent focus:outline-none sm:text-center leading-loose" />
              <ErrorMsg msg={errors.confessionFather?.message} />
            </InputWrap>
            <div className="flex-1 flex items-center gap-4 w-full">
              <span className="whitespace-nowrap sm:pl-4">خادم بكنيسه أخرى :</span>
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input type="radio" value="نعم" {...register("servesOtherChurch")} className="opacity-0 absolute inset-0 cursor-pointer peer" />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                  </span>
                <span>نعم</span>
              </label>
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                 <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input type="radio" value="لا" {...register("servesOtherChurch")} className="opacity-0 absolute inset-0 cursor-pointer peer" />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                  </span>
                <span>لا</span>
              </label>
            </div>
          </div>

          <InputWrap className="w-full mt-6 flex-col sm:flex-row pb-6">
            <label className="whitespace-nowrap pr-2 w-full sm:w-auto mb-2 sm:mb-0">الكنيسة المواظب الحضور بها :</label>
            <input type="text" {...register("attendedChurch")} className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none leading-loose" />
            <ErrorMsg msg={errors.attendedChurch?.message} />
          </InputWrap>

          {/* Footer Separator */}
          <div className="border-t-[2px] border-black mt-8 mb-1"></div>
          <div className="border-t-4 border-black mb-4"></div>
          
          <div className="text-center text-xs sm:text-sm bg-white py-2">
            " هذه البيانات خاصه بقاعدة بيانات إجتماع الشباب فقط "
          </div>
        </form>
      </div>

      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto">
        <button
          type="button"
          onClick={handleSubmit(onSubmit, onError)}
          disabled={isExporting}
          className={cn(
            "flex items-center justify-center gap-3 px-6 py-4 sm:px-8 w-full sm:w-auto rounded-full shadow-2xl font-bold text-base sm:text-lg transition-all",
            "bg-[#1da1f2] hover:bg-blue-600 text-white",
            isExporting && "opacity-80 cursor-wait"
          )}
        >
          {isExporting ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6" />}
          <span>{isExporting ? "جاري التحضير..." : "حفظ الصورة"}</span>
        </button>
      </div>

      {modalImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-6" style={{ direction: 'rtl' }}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 flex flex-col items-center gap-6 animate-in zoom-in-95">
             <h3 className="text-xl font-bold text-center text-green-700">تم إنشاء الاستمارة بنجاح!</h3>
             
             <div className="relative w-full max-h-[50vh] overflow-y-auto border-2 border-gray-200 rounded-lg p-2 bg-gray-50 flex justify-center">
                {/* User can long press this image to save on iOS */}
                <img src={modalImage} alt="الاستمارة" className="w-full h-auto object-contain pointer-events-auto" style={{ WebkitTouchCallout: 'default' }} />
             </div>
             
             <p className="text-sm sm:text-base text-gray-700 text-center font-medium bg-blue-50 p-3 rounded-lg w-full">
               📱 <strong>لحفظ الصورة على هاتفك:</strong><br/>
               اضغط مطولاً على الصورة في الأعلى ثم اختر "حفظ الصورة" أو "Save Image".
             </p>

             <div className="flex w-full gap-4 mt-2">
                <button 
                  onClick={handleShare}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> أو مشاركة / تنزيل
                </button>
                <button 
                  onClick={() => setModalImage(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 px-6 rounded-lg"
                >
                  إغلاق
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
