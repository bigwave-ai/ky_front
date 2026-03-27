// app/(view)/(every)/signin/signin-client.tsx
"use client";

import smc from "./signin.module.css";
import React, { useState, ChangeEvent, useEffect } from "react";
import { MuiInputText2 } from "../../../components/libs/muis/mui-input-group";
import { useRouter, useSearchParams } from "next/navigation";
import { base64Encode } from "@/app/services/util/base64";
import { useSetAtom } from "jotai";
import { userInfoAtom } from "@/app/models/atoms/atom-user-info";

// 모달들
import WarningModal from "@/app/components/libs/modals/modal-warnning";
import LoadingModal from "@/app/components/libs/modals/modal-loading";

/*
 * 01. 구분     : Credential Component
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - Login
 * 03. 설명     : 커스텀 로그인 화면 제공
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */

type SignInResponseData = {
  user_id: string;
  name?: string;
  role?: string;
  email?: string;
  contact?: string;
  status?: string;
};

type SignInResponse = {
  success: boolean;
  data?: SignInResponseData;
  message?: string;
};

const CredentialProvider = () => {
  /******************** 변수 영역 ********************/
  const REMEMBER_ME_KEY = "autoSADSDD_rememberMe";
  const SAVED_ID_KEY = "autoSADSDD_savedId";

  const [formData, setFormData] = useState({ id: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "내 정보 기억하기" 체크박스 상태
  const [rememberMe, setRememberMe] = useState(false);

  // 경고 모달 상태
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTitle, setWarnTitle] = useState("");
  const [warnDetail, setWarnDetail] = useState("");

  // 전역 유저 정보 설정
  const setUserInfo = useSetAtom(userInfoAtom);
  const router = useRouter();
  const searchParams = useSearchParams();

  /******************** 함수영역 ********************/
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title);
    setWarnDetail(detail);
    setWarnOpen(true);
  };

  const closeWarn = () => setWarnOpen(false);

  // Input 텍스트 변경 이벤트
  const handleChangeInputText = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prev) => ({
      ...prev,
      [name as keyof typeof prev]: value,
    }));
  };

  // "내 정보 기억하기" 토글
  const handleToggleRememberMe = () => {
    setRememberMe((prev) => !prev);
  };

  // 로그인 버튼 클릭 이벤트
  const handleClickLoginButton = () => {
    const id = formData.id.trim();
    const password = formData.password.trim();

    if (!id || !password) {
      openWarn("알림", "아이디와 비밀번호를 확인해주세요.");
      return;
    }

    fetchSignIn();
  };

  // 로그인 요청 함수
  const fetchSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // 서버 정책: pw는 base64로 전달
    const payload = {
      id: formData.id.trim(),
      pw: base64Encode(formData.password),
    };

    try {
      const response = await fetch(`/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result: SignInResponse | null = null;
      try {
        result = (await response.json()) as SignInResponse;
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success || !result?.data) {
        if (response.status === 401) {
          openWarn("로그인 실패", "아이디 또는 비밀번호가 잘못되었습니다.");
        } else if (response.status === 400) {
          openWarn("입력 오류", result?.message ?? "입력값을 확인해주세요.");
        } else if (response.status === 500) {
          openWarn("서버 오류", "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          openWarn("실패", result?.message ?? "알 수 없는 오류가 발생했습니다.");
        }
        return;
      }

      // ✅ "내 정보 기억하기" 처리 (아이디만 저장)
      if (typeof window !== "undefined") {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, "true");
          localStorage.setItem(SAVED_ID_KEY, formData.id.trim());
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(SAVED_ID_KEY);
        }
      }

      // ✅ 로그인 사용자 정보 저장 (Jotai + localStorage)
      const role = (result.data.role ?? "member").trim().toLowerCase();
      const status = (result.data.status ?? "활성").trim();

      setUserInfo({
        user_id: result.data.user_id,
        name: result.data.name ?? "",
        role,
        email: result.data.email ?? "",
        contact: result.data.contact ?? "",
        status,
      });

      // ✅ 권한 기반 라우팅
      const dest = role === "admin" ? "/IntegratedMonitoring" : "/DetailMonitoring";
      router.push(dest);
    } catch (error) {
      console.error("Error during sign-in:", error);
      openWarn("오류", "로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /******************** 수행 영역 ********************/
  // Enter 키로 로그인
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (warnOpen && event.key === "Enter") {
        event.preventDefault();
        closeWarn();
        return;
      }

      if (event.key === "Enter" && !isSubmitting) {
        handleClickLoginButton();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, warnOpen, isSubmitting]);

  // JWT 세션 만료 안내
  useEffect(() => {
    const error = searchParams?.get("error");
    if (error === "session_expired") {
      openWarn("세션 만료", "세션이 만료되었습니다. 다시 로그인해주세요.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 저장된 아이디/체크 상태 초기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedFlag = localStorage.getItem(REMEMBER_ME_KEY);
    const savedId = localStorage.getItem(SAVED_ID_KEY);

    if (savedFlag === "true" && savedId) {
      setRememberMe(true);
      setFormData((prev) => ({ ...prev, id: savedId }));
    }
  }, []);

  return (
    <div className={smc.auth_background}>
      <LoadingModal
        open={isSubmitting}
        message="로그인 중입니다..."
        subMessage="잠시만 기다려 주세요."
      />

      <div className={smc.signin_card}>
        <div className={smc.signin_card_head}>
          <span className={smc.signin_head_badge}>AI Agent 기반</span>
          <h1 className={smc.signin_head_title}>컴프레서 현황 관리 시스템</h1>
        </div>

        <div className={smc.signin_card_body}>
          <div className={smc.login_text}>로그인</div>
          <div className={smc.login_detail_text}>
            로그인을 위해 아이디와 비밀번호를 입력해주세요.
          </div>

          <div className={smc.login_id_text}>아이디</div>
          <div className={smc.signin_input_wrap}>
            <MuiInputText2
              placeholder="아이디를 입력해주세요."
              name="id"
              value={formData.id}
              width="100%"
              height="52px"
              textAlign="left"
              backgroundColor="#F8FBFF"
              borderColor="#B5D8F6"
              fnChangeInputText={handleChangeInputText}
              disabled={isSubmitting}
            />
          </div>

          <div className={smc.login_pw_text}>비밀번호</div>
          <div className={smc.signin_input_wrap}>
            <MuiInputText2
              placeholder="비밀번호를 입력해주세요."
              name="password"
              type="password"
              value={formData.password}
              width="100%"
              height="52px"
              textAlign="left"
              backgroundColor="#F8FBFF"
              borderColor="#B5D8F6"
              fnChangeInputText={handleChangeInputText}
              disabled={isSubmitting}
            />
          </div>

          {/* 아이디/비밀번호 찾기 제거, 회원가입 제거 */}
          <div className={smc.remember_row}>
            <label className={smc.remember_me}>
              <input
                type="checkbox"
                className={smc.remember_checkbox}
                checked={rememberMe}
                onChange={handleToggleRememberMe}
                disabled={isSubmitting}
              />
              <span className={smc.remember_label}>내 정보 기억하기</span>
            </label>
          </div>

          <div className={smc.login_button_div}>
            <button
              type="button"
              className={smc.signin_button}
              onClick={handleClickLoginButton}
              aria-label="로그인"
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </div>

          <div className={smc.company_logo_container}>
            <div className={smc.company_logo_bottom} />
          </div>
        </div>

        <WarningModal
          open={warnOpen}
          title={warnTitle}
          detail={warnDetail}
          onConfirm={closeWarn}
          onCancel={closeWarn}
        />
      </div>
    </div>
  );
};

export default CredentialProvider;
