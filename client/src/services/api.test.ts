import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { ApiUnavailableError, getErrorMessage } from "./api";

const axiosError = (status?: number, data?: unknown) => {
  const config = { headers: new AxiosHeaders() };
  const response = status ? { status, data, statusText: "", headers: {}, config } : undefined;
  return new AxiosError("Request failed", "ERR", config, undefined, response);
};

describe("API xəta mesajları", () => {
  it("serverin mesajını göstərir", () => {
    expect(getErrorMessage(axiosError(400, { message: "Yanlış şifrə" }))).toBe("Yanlış şifrə");
  });

  it("şəbəkə xətasını başa düşülən dildə izah edir", () => {
    expect(getErrorMessage(axiosError())).toContain("Serverə qoşulmaq mümkün olmadı");
  });

  it("backend tapılmayanda konfiqurasiya göstərişi verir", () => {
    expect(getErrorMessage(new ApiUnavailableError())).toContain("VITE_API_URL");
  });

  it("adi xətanı qaytarır", () => {
    expect(getErrorMessage(new Error("xəta"))).toBe("xəta");
  });
});
