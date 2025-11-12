import { useState, useRef } from "react";
import { Upload, Play, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { uploadFile, repairCode, type RepairResponse } from "../lib/api";

export function BugFixer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalCode, setOriginalCode] = useState<string>("");
  const [fixedCode, setFixedCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepairResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setResult(null);
    setFixedCode("");

    // Read the file content to show original code
    const text = await file.text();
    setOriginalCode(text);
  };

  const handleFix = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setFixedCode("");

    try {
      // Upload the file
      const uploadResponse = await uploadFile(selectedFile, "python");
      console.log("Upload response:", uploadResponse);

      // Repair the code
      const repairResponse = await repairCode(uploadResponse.run_id, {
        language: "python",
      });
      console.log("Repair response:", repairResponse);

      setResult(repairResponse);

      // Set the fixed code from the response
      if (repairResponse.fixed_code) {
        setFixedCode(repairResponse.fixed_code);
      }

      // Also update original code if provided (in case it was normalized)
      if (repairResponse.original_code) {
        setOriginalCode(repairResponse.original_code);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setOriginalCode("");
    setFixedCode("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateDiff = (original: string, fixed: string): string[] => {
    const originalLines = original.split("\n");
    const fixedLines = fixed.split("\n");
    const diff: string[] = [];

    const maxLines = Math.max(originalLines.length, fixedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || "";
      const fixedLine = fixedLines[i] || "";

      if (origLine !== fixedLine) {
        if (origLine && !fixedLine) {
          diff.push(`- ${origLine}`);
        } else if (!origLine && fixedLine) {
          diff.push(`+ ${fixedLine}`);
        } else {
          diff.push(`- ${origLine}`);
          diff.push(`+ ${fixedLine}`);
        }
      } else {
        diff.push(`  ${origLine}`);
      }
    }

    return diff;
  };

  const renderDiffLine = (line: string, index: number) => {
    if (line.startsWith("+ ")) {
      return (
        <div key={index} className="bg-green-500/10 border-l-2 border-green-500 px-4 py-1">
          <span className="text-green-500 font-bold mr-2">+</span>
          <span className="text-green-400">{line.substring(2)}</span>
        </div>
      );
    } else if (line.startsWith("- ")) {
      return (
        <div key={index} className="bg-red-500/10 border-l-2 border-red-500 px-4 py-1">
          <span className="text-red-500 font-bold mr-2">-</span>
          <span className="text-red-400">{line.substring(2)}</span>
        </div>
      );
    } else {
      return (
        <div key={index} className="px-4 py-1 text-muted-foreground">
          <span className="mr-2"> </span>
          <span>{line.substring(2)}</span>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">CICI Bug Fixer</h1>
        <p className="text-lg text-muted-foreground">
          Upload your buggy Python code and let AI fix it for you
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Python File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".py"
              onChange={handleFileSelect}
              className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
            <Button
              onClick={handleFix}
              disabled={!selectedFile || loading}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Fix Code
                </>
              )}
            </Button>
            {(selectedFile || result) && (
              <Button onClick={reset} variant="outline">
                Reset
              </Button>
            )}
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              <span>Selected: {selectedFile.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fix Result</span>
              <Badge
                variant={result.status === "success" ? "success" : "destructive"}
              >
                {result.status === "success" ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Iterations:</span>{" "}
                {result.iterations}
              </div>
              {result.message && (
                <div className="col-span-2">
                  <span className="font-semibold">Message:</span>{" "}
                  {result.message}
                </div>
              )}
              {result.status === "success" && result.output && (
                <div className="col-span-2">
                  <span className="font-semibold">Output:</span>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {result.output}
                  </pre>
                </div>
              )}
              {result.status === "failed" && result.last_error && (
                <div className="col-span-2">
                  <span className="font-semibold text-destructive">Last Error:</span>
                  <pre className="mt-2 p-3 bg-destructive/10 rounded-md text-xs overflow-x-auto text-destructive">
                    {result.last_error}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code Comparison */}
      {originalCode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Original Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Code</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <pre className="bg-slate-950 text-slate-50 p-4 overflow-x-auto text-sm">
                  <code>{originalCode}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Fixed Code */}
          {fixedCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Fixed Code
                  <Badge variant="success">
                    <Check className="h-3 w-3 mr-1" />
                    Fixed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <pre className="bg-slate-950 text-green-50 p-4 overflow-x-auto text-sm">
                    <code>{fixedCode}</code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Diff View */}
      {originalCode && fixedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code Diff</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="font-mono text-xs">
                {generateDiff(originalCode, fixedCode).map((line, index) =>
                  renderDiffLine(line, index)
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
