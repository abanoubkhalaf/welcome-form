"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CloudUpload } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import { ar } from "date-fns/locale";
import { format } from "date-fns";
import { motion } from "framer-motion";
import "react-datepicker/dist/react-datepicker.css";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ErrorMsg = ({ msg }: { msg?: string }) => {
  if (!msg) return null;
  return (
    <span className="text-red-500 text-xs absolute -bottom-4 right-0 font-normal">
      {msg}
    </span>
  );
};

const InputWrap = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "relative flex items-center gap-2 group transition-all duration-300",
      className,
    )}
  >
    {children}
  </div>
);

const arabicDigitsRegex = /^[0-9٠-٩]+$/;
const mobileRegex = /^[0٠][1١][0125٠١٢٥][0-9٠-٩]{8}$/;
const homePhoneRegex = /^[0-9٠-٩]{7,9}$/;

const formSchema = z.object({
  servantName: z.string().min(1, "مطلوب"),
  todayDate: z.date({ message: "مطلوب" }),
  fullName: z
    .string()
    .min(1, "الاسم الرباعي مطلوب")
    .refine(
      (val) => val.trim().split(/\s+/).filter(Boolean).length >= 4,
      "رجاء إدخال الاسم رباعي (4 أسماء على الأقل)",
    ),
  dob: z.date({ message: "مطلوب" }),
  homePhone: z
    .string()
    .optional()
    .refine(
      (val) => !val || homePhoneRegex.test(val),
      "يجب أن يكون من 7 إلى 9 أرقام",
    ),
  mobile1: z.string().regex(mobileRegex, "رقم موبايل غير صحيح"),
  mobile2: z
    .string()
    .optional()
    .refine((val) => !val || mobileRegex.test(val), "رقم موبايل غير صحيح"),
  maritalStatus: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", { message: "مطلوب" }),
  addressBuilding: z
    .string()
    .min(1, "مطلوب")
    .refine((val) => arabicDigitsRegex.test(val), "أرقام فقط"),
  addressStreet: z.string().min(1, "مطلوب"),
  addressFloor: z
    .string()
    .optional()
    .refine((val) => !val || arabicDigitsRegex.test(val), "أرقام فقط"),
  addressApt: z
    .string()
    .optional()
    .refine((val) => !val || arabicDigitsRegex.test(val), "أرقام فقط"),
  addressArea: z.string().min(1, "مطلوب"),
  addressLandmark: z.string().optional(),
  educationStatus: z.string().nullish(),
  studentYear: z
    .string()
    .optional()
    .refine((val) => !val || arabicDigitsRegex.test(val), "أرقام فقط"),
  university: z.string().optional(),
  college: z.string().optional(),
  graduationYear: z
    .string()
    .optional()
    .refine((val) => !val || arabicDigitsRegex.test(val), "أرقام فقط"),
  workStatus: z.string().nullish(),
  jobTitle: z.string().optional(),
  confessionFather: z.string().optional(),
  servesOtherChurch: z.string().nullish(),
  attendedChurch: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ScrollSection = ({
  children,
  x = 0,
  y = 20,
  delay = 0,
}: {
  children: React.ReactNode;
  x?: number;
  y?: number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x, y }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true, margin: "-150px" }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function ChurchForm() {
  const [isExporting, setIsExporting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      todayDate: new Date(),
      dob: undefined,
      servantName: "",
    },
  });

  useEffect(() => {
    const savedName = localStorage.getItem("church_servant_name");
    if (savedName) {
      reset((prev) => ({ ...prev, servantName: savedName }));
    }
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsExporting(true);

      localStorage.setItem("church_servant_name", data.servantName);

      const names = data.fullName.trim().split(/\s+/).slice(0, 2).join("_");
      const fileName = `estmaret_${names}_${format(new Date(), "dd-MM-yyyy")}.pdf`;

      toast.info("جاري إنشاء PDF والرفع على Google Drive...");

      const response = await fetch("/api/upload-to-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: {
            ...data,
            todayDate: format(data.todayDate, "yyyy-MM-dd"),
            dob: format(data.dob, "yyyy/MM/dd"),
          },
          fileName,
          folderDate: format(data.todayDate, "yyyy-MM-dd"),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "فشل الرفع");
      }

      toast.success(
        `تم رفع الاستمارة بنجاح كملف PDF! 📁 المجلد: ${result.folder}`,
      );

      reset({
        servantName: data.servantName,
        todayDate: data.todayDate,
        fullName: "",
        dob: undefined,
        mobile1: "",
        mobile2: "",
        homePhone: "",
        addressBuilding: "",
        addressStreet: "",
        addressArea: "",
        addressFloor: "",
        addressApt: "",
        addressLandmark: "",
        educationStatus: null,
        studentYear: "",
        university: "",
        college: "",
        graduationYear: "",
        workStatus: null,
        jobTitle: "",
        confessionFather: "",
        servesOtherChurch: null,
        attendedChurch: "",
      });
    } catch (err: any) {
      console.error("Failed to upload", err);
      toast.error("حدث خطأ أثناء رفع الاستمارة: " + (err.message || ""));
    } finally {
      setIsExporting(false);
    }
  };

  const onError = (formErrors: any) => {
    console.log("Validation failed", formErrors);
    toast.error("برجاء إكمال الحقول المطلوبة ومراجعة الأخطاء باللون الأحمر");
  };

  return (
    <div className="w-full flex justify-center pb-20">
      <div
        className="w-full max-w-[850px] bg-white p-4 sm:p-12 relative border-4 border-white overflow-visible mb-20"
        style={{ direction: "rtl" }}
      >
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.webp"
            alt="Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-black">
            إستمارة بيانات
          </h1>
        </div>

        <div className="border-t-4 border-black mb-1"></div>
        <div className="border-t-[2px] border-black mb-6"></div>

        <form
          className="space-y-8 text-sm sm:text-base font-bold text-black"
          onSubmit={(e) => e.preventDefault()}
          id="churchForm"
        >
          <fieldset
            disabled={isExporting}
            className="space-y-8 disabled:opacity-70 transition-opacity"
          >
            {/* Row 1 */}
            <ScrollSection y={0} delay={0.1}>
              <div className="flex flex-col sm:flex-row justify-between gap-6 relative z-50">
                <InputWrap className="flex-1 w-full min-w-0">
                  <label className="whitespace-nowrap shrink-0">
                    تاريخ اليوم :
                  </label>
                  <Controller
                    control={control}
                    name="todayDate"
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => field.onChange(date)}
                        locale={ar}
                        dateFormat="yyyy/MM/dd"
                        portalId="root-portal"
                        className="flex-1 w-full min-w-0 border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all text-center placeholder-gray-500"
                      />
                    )}
                  />
                  <ErrorMsg msg={errors.todayDate?.message} />
                </InputWrap>
                <InputWrap className="flex-1">
                  <label className="whitespace-nowrap">
                    أسم الخادم <span>/</span> ة :
                  </label>
                  <input
                    type="text"
                    {...register("servantName")}
                    className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 focus:text-blue-700 transition-all text-center"
                  />
                  <ErrorMsg msg={errors.servantName?.message} />
                </InputWrap>
              </div>
            </ScrollSection>

            {/* Row 2 */}
            <ScrollSection x={40} delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <label className="whitespace-nowrap sm:self-center">
                  الأسم رباعي :
                </label>
                <div className="flex-1 relative w-full">
                  <input
                    type="text"
                    {...register("fullName")}
                    className="w-full border-2 border-black p-2 bg-transparent focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-12"
                  />
                  <ErrorMsg msg={errors.fullName?.message} />
                </div>
              </div>
            </ScrollSection>

            {/* Row 3 - Birth Date */}
            <ScrollSection x={-40} delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full relative z-30">
                <div className="flex-1 flex flex-col sm:flex-row sm:gap-4 lg:pr-1 relative min-w-0">
                  <label className="whitespace-nowrap mb-2 sm:mb-0 sm:self-center shrink-0">
                    تاريخ الميلاد :
                  </label>
                  <Controller
                    control={control}
                    name="dob"
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => field.onChange(date)}
                        locale={ar}
                        dateFormat="yyyy/MM/dd"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={120}
                        portalId="root-portal"
                        className="flex-1 w-full min-w-0 border-2 border-black p-2 bg-transparent focus:outline-none focus:border-blue-500 transition-all h-12 text-center"
                      />
                    )}
                  />
                  <ErrorMsg msg={errors.dob?.message} />
                </div>
                <InputWrap className="flex-[0.8]">
                  <label className="whitespace-nowrap">تليفون المنزل :</label>
                  <input
                    type="tel"
                    {...register("homePhone")}
                    className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all font-mono tracking-widest leading-loose"
                  />
                  <ErrorMsg msg={errors.homePhone?.message} />
                </InputWrap>
              </div>
            </ScrollSection>

            {/* Row 4 */}
            <ScrollSection x={40} delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full">
                <div className="flex-1 flex flex-col sm:flex-row sm:gap-4 lg:pr-1 relative">
                  <label className="whitespace-nowrap mb-1 sm:mb-0 sm:self-center">
                    الموبيل :
                  </label>
                  <input
                    type="tel"
                    {...register("mobile1")}
                    className="flex-1 w-full border-2 border-black p-2 tracking-[0.1em] sm:tracking-[0.3em] font-mono bg-transparent focus:outline-none focus:border-blue-500 transition-all text-center h-12"
                    maxLength={11}
                  />
                  <ErrorMsg msg={errors.mobile1?.message} />
                </div>
                <div className="flex-[0.8] flex flex-col sm:flex-row sm:gap-4 lg:pr-1 relative">
                  <label className="whitespace-nowrap mb-1 sm:mb-0 sm:self-center">
                    الموبيل :
                  </label>
                  <input
                    type="tel"
                    {...register("mobile2")}
                    className="flex-1 w-full border-2 border-black p-2 tracking-[0.1em] sm:tracking-[0.3em] font-mono bg-transparent focus:outline-none focus:border-blue-500 transition-all text-center h-12"
                    maxLength={11}
                  />
                  <ErrorMsg msg={errors.mobile2?.message} />
                </div>
              </div>
            </ScrollSection>

            {/* Row 5 - Marital Status */}
            <ScrollSection x={-40} delay={0.5}>
              <div className="relative flex flex-wrap items-center gap-4 sm:gap-6 py-2">
                <span className="whitespace-nowrap">الحاله الاجتماعيه :</span>
                {(
                  ["أعزب / ة", "متزوج / ة", "أرمل / ة", "مطلق / ة"] as const
                ).map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:scale-105 transition-transform active:scale-95"
                  >
                    <input
                      type="radio"
                      value={status}
                      {...register("maritalStatus")}
                      className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black appearance-none checked:bg-black checked:border-white ring-2 ring-black transition-all cursor-pointer"
                    />
                    <span className="text-sm sm:text-base">{status}</span>
                  </label>
                ))}
                <ErrorMsg msg={errors.maritalStatus?.message} />
              </div>
            </ScrollSection>

            {/* Row 6 - Address */}
            <ScrollSection x={40} delay={0.6}>
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 w-full">
                <span className="whitespace-nowrap w-full sm:w-auto">
                  العنوان :
                </span>
                <InputWrap className="w-1/3 sm:w-32 flex-col sm:flex-row items-start sm:items-center">
                  <label className="text-sm shrink-0">رقم العقار :</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    {...register("addressBuilding")}
                    className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <ErrorMsg msg={errors.addressBuilding?.message} />
                </InputWrap>
                <InputWrap className="flex-1 min-w-[150px] flex-col sm:flex-row items-start sm:items-center">
                  <label className="text-sm shrink-0">أسم الشارع :</label>
                  <input
                    type="text"
                    {...register("addressStreet")}
                    className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <ErrorMsg msg={errors.addressStreet?.message} />
                </InputWrap>
                <InputWrap className="w-1/4 sm:w-24 flex-col sm:flex-row items-start sm:items-center">
                  <label className="text-sm shrink-0">دور :</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    {...register("addressFloor")}
                    className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <ErrorMsg msg={errors.addressFloor?.message} />
                </InputWrap>
                <InputWrap className="w-1/4 sm:w-24 flex-col sm:flex-row items-start sm:items-center">
                  <label className="text-sm shrink-0">شقه :</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    {...register("addressApt")}
                    className="w-full sm:flex-1 border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <ErrorMsg msg={errors.addressApt?.message} />
                </InputWrap>
              </div>
            </ScrollSection>

            <ScrollSection x={-40} delay={0.7}>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-2">
                <InputWrap className="flex-1 w-full justify-start items-center">
                  <label className="whitespace-nowrap sm:pr-[4.5rem]">
                    المنطقة :
                  </label>
                  <input
                    type="text"
                    {...register("addressArea")}
                    className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all leading-loose"
                  />
                  <ErrorMsg msg={errors.addressArea?.message} />
                </InputWrap>
                <InputWrap className="flex-1 w-full justify-start items-center">
                  <label className="whitespace-nowrap">
                    علامه مميزة للعنوان :
                  </label>
                  <input
                    type="text"
                    {...register("addressLandmark")}
                    className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent text-center focus:outline-none focus:border-blue-500 transition-all leading-loose"
                  />
                </InputWrap>
              </div>
            </ScrollSection>

            <div className="text-center text-xs sm:text-sm bg-white py-1 border-y-2 border-black mt-8">
              " ليس من الضروري استكمال البيانات التاليه اذا كان سن المخدوم فوق
              32 سنه "
            </div>

            {/* Row 9 - Education & Work */}
            <ScrollSection y={30}>
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
                  <label className="flex items-center gap-3 cursor-pointer w_auto sm:w-24 shrink-0">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input
                        type="radio"
                        value="طالب"
                        {...register("educationStatus")}
                        className="opacity-0 absolute inset-0 cursor-pointer peer"
                      />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none transition-opacity"></span>
                    </span>
                    <span>طالب</span>
                  </label>
                  <div className="flex-1 flex flex-col sm:flex-row w-full gap-4">
                    <InputWrap className="flex-1">
                      <span className="whitespace-nowrap">جامعه :</span>
                      <input
                        type="text"
                        {...register("university")}
                        className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all leading-loose"
                      />
                    </InputWrap>
                    <InputWrap className="flex-1">
                      <span className="whitespace-nowrap">كلية :</span>
                      <input
                        type="text"
                        {...register("college")}
                        className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all leading-loose"
                      />
                    </InputWrap>
                    <InputWrap className="flex-[0.6]">
                      <span className="whitespace-nowrap">فرقة/سنة :</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        {...register("studentYear")}
                        className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all text-center"
                      />
                      <ErrorMsg msg={errors.studentYear?.message} />
                    </InputWrap>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
                  <label className="flex items-center gap-3 cursor-pointer w-auto sm:w-24 shrink-0">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input
                        type="radio"
                        value="خريج"
                        {...register("educationStatus")}
                        className="opacity-0 absolute inset-0 cursor-pointer peer"
                      />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none transition-opacity"></span>
                    </span>
                    <span>خريج</span>
                  </label>

                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
                    <div className="flex items-center gap-6 shrink-0">
                      <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                          <input
                            type="radio"
                            value="يعمل"
                            {...register("workStatus")}
                            className="opacity-0 absolute inset-0 cursor-pointer peer"
                          />
                          <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                        </span>
                        <span>يعمل</span>
                      </label>
                      <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                          <input
                            type="radio"
                            value="لايعمل"
                            {...register("workStatus")}
                            className="opacity-0 absolute inset-0 cursor-pointer peer"
                          />
                          <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none"></span>
                        </span>
                        <span>لايعمل</span>
                      </label>
                    </div>

                    <InputWrap className="flex-1 w-full">
                      <span className="whitespace-nowrap shrink-0">
                        الوظيفة :
                      </span>
                      <input
                        type="text"
                        {...register("jobTitle")}
                        className="flex-1 border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all w-full leading-loose"
                      />
                    </InputWrap>

                    <InputWrap className="flex-[0.8] w-full">
                      <span className="whitespace-nowrap shrink-0">
                        سنة التخرج :
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        {...register("graduationYear")}
                        className="flex-1 border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all w-full leading-loose text-center"
                      />
                      <ErrorMsg msg={errors.graduationYear?.message} />
                    </InputWrap>
                  </div>
                </div>
              </div>
            </ScrollSection>

            {/* Row 10 - Church Info */}
            <ScrollSection x={30}>
              <div className="flex flex-col sm:flex-row gap-6 mt-6 items-start sm:items-center">
                <InputWrap className="flex-[1.5] w-full flex-col sm:flex-row items-start sm:items-center">
                  <label className="whitespace-nowrap pr-2">
                    أب الاعتراف :
                  </label>
                  <input
                    type="text"
                    {...register("confessionFather")}
                    className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all leading-loose text-center"
                  />
                  <ErrorMsg msg={errors.confessionFather?.message} />
                </InputWrap>
                <div className="flex-1 flex items-center gap-4 w-full">
                  <span className="whitespace-nowrap pl-4">
                    خادم بكنيسه أخرى :
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input
                        type="radio"
                        value="نعم"
                        {...register("servesOtherChurch")}
                        className="opacity-0 absolute inset-0 cursor-pointer peer"
                      />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none transition-opacity"></span>
                    </span>
                    <span>نعم</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black flex items-center justify-center bg-white relative">
                      <input
                        type="radio"
                        value="لا"
                        {...register("servesOtherChurch")}
                        className="opacity-0 absolute inset-0 cursor-pointer peer"
                      />
                      <span className="opacity-0 peer-checked:opacity-100 w-full h-full bg-black border-2 border-white pointer-events-none transition-opacity"></span>
                    </span>
                    <span>لا</span>
                  </label>
                </div>
              </div>
            </ScrollSection>

            <ScrollSection x={-30}>
              <InputWrap className="w-full mt-6 flex-col sm:flex-row pb-6">
                <label className="whitespace-nowrap pr-2">
                  الكنيسة المواظب الحضور بها :
                </label>
                <input
                  type="text"
                  {...register("attendedChurch")}
                  className="flex-1 w-full border-b-2 border-dotted border-black bg-transparent focus:outline-none focus:border-blue-500 transition-all leading-loose text-center"
                />
                <ErrorMsg msg={errors.attendedChurch?.message} />
              </InputWrap>
            </ScrollSection>

            {/* Footer Separator */}
            <div className="border-t-[2px] border-black mt-8 mb-1"></div>
            <div className="border-t-4 border-black mb-4"></div>

            <div className="text-center text-xs sm:text-sm bg-white py-2">
              " هذه البيانات خاصه بقاعدة بيانات إجتماع الشباب فقط "
            </div>
          </fieldset>
        </form>
      </div>

      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto">
        <button
          type="button"
          onClick={handleSubmit(onSubmit, onError)}
          disabled={isExporting}
          className={cn(
            "flex items-center justify-center gap-3 px-6 py-4 sm:px-8 w-full sm:w-auto rounded-full shadow-2xl font-bold text-base sm:text-lg transition-all active:scale-95",
            "bg-[#1da1f2] hover:bg-blue-600 text-white hover:shadow-blue-500/50 hover:shadow-xl",
            isExporting && "opacity-80 cursor-wait animate-pulse",
          )}
        >
          {isExporting ? (
            <Loader2 className="animate-spin w-6 h-6" />
          ) : (
            <CloudUpload className="w-6 h-6" />
          )}
          <span>{isExporting ? "جاري الرفع..." : "رفع الاستمارة"}</span>
        </button>
      </div>

      <div id="root-portal" className="relative z-[100]" />
    </div>
  );
}
