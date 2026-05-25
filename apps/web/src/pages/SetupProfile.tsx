import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useSetInfo } from "@/features/auth/index";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupProfilePage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { handleSetInfo, loading } = useSetInfo();

  const passwordTouched = password.length > 0;
  const tooShort = passwordTouched && password.length < 12;
  const missingUppercase = passwordTouched && !/[A-Z]/.test(password);
  const missingLowercase = passwordTouched && !/[a-z]/.test(password);
  const missingNumber = passwordTouched && !/[0-9]/.test(password);
  const missingSpecial = passwordTouched && !/[^A-Za-z0-9]/.test(password);

  const passwordErrors = [
    tooShort && "at least 12 characters",
    missingUppercase && "an uppercase letter",
    missingLowercase && "a lowercase letter",
    missingNumber && "a number",
    missingSpecial && "a special character",
  ].filter(Boolean) as string[];

  const canSubmit =
    username.length > 0 && password.length > 0 && passwordErrors.length === 0;

  return (
    <div className="auth-shell">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            One last step
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSetInfo({ username, password });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="mara_reyes"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                This is how others will see you on the platform.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 12 characters"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.length > 0 && (
                <p className="text-xs text-destructive">
                  Password must contain {passwordErrors.join(", ")}.
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
