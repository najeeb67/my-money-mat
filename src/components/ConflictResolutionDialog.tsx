/**
 * Conflict Resolution Dialog Component
 * 
 * Displays conflicts between local and server versions
 * and allows users to choose how to resolve each conflict.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Cloud, Smartphone, GitMerge, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  SyncConflict,
  ConflictResolution,
  ResolvedConflict,
  mergeItems,
} from '@/lib/conflictResolution';
import { format } from 'date-fns';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: SyncConflict[];
  onResolve: (resolutions: ResolvedConflict[]) => void;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());

  const handleResolutionChange = (conflictId: string, resolution: ConflictResolution) => {
    setResolutions((prev) => {
      const next = new Map(prev);
      next.set(conflictId, resolution);
      return next;
    });
  };

  const toggleExpanded = (conflictId: string) => {
    setExpandedConflicts((prev) => {
      const next = new Set(prev);
      if (next.has(conflictId)) {
        next.delete(conflictId);
      } else {
        next.add(conflictId);
      }
      return next;
    });
  };

  const handleResolveAll = () => {
    const resolvedConflicts: ResolvedConflict[] = conflicts.map((conflict) => {
      const resolution = resolutions.get(conflict.localItem.id) || 'keep_local';
      return {
        ...conflict,
        resolution,
        mergedItem: resolution === 'merge' ? mergeItems(conflict.localItem, conflict.serverItem) : undefined,
      };
    });
    onResolve(resolvedConflicts);
    onOpenChange(false);
  };

  const handleKeepAllLocal = () => {
    const newResolutions = new Map<string, ConflictResolution>();
    conflicts.forEach((c) => newResolutions.set(c.localItem.id, 'keep_local'));
    setResolutions(newResolutions);
  };

  const handleKeepAllServer = () => {
    const newResolutions = new Map<string, ConflictResolution>();
    conflicts.forEach((c) => newResolutions.set(c.localItem.id, 'keep_server'));
    setResolutions(newResolutions);
  };

  const allResolved = conflicts.every((c) => resolutions.has(c.localItem.id));

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM d, yyyy h:mm a');
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
    return type === 'expense' ? `-${formatted}` : `+${formatted}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Sync Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} item(s) were modified both offline and on the server. 
            Choose how to resolve each conflict.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions */}
        <div className="flex gap-2 py-2">
          <Button variant="outline" size="sm" onClick={handleKeepAllLocal}>
            <Smartphone className="h-4 w-4 mr-1" />
            Keep All Local
          </Button>
          <Button variant="outline" size="sm" onClick={handleKeepAllServer}>
            <Cloud className="h-4 w-4 mr-1" />
            Keep All Server
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            <AnimatePresence>
              {conflicts.map((conflict, index) => {
                const conflictId = conflict.localItem.id;
                const currentResolution = resolutions.get(conflictId);
                const isExpanded = expandedConflicts.has(conflictId);

                return (
                  <motion.div
                    key={conflictId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "border-2 transition-colors",
                      currentResolution && "border-primary/50 bg-primary/5"
                    )}>
                      <CardContent className="p-4">
                        {/* Conflict Header */}
                        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(conflictId)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={conflict.conflictType === 'both_modified' ? 'destructive' : 'secondary'}>
                                {conflict.conflictType === 'both_modified' && 'Both Modified'}
                                {conflict.conflictType === 'delete_local' && 'Deleted Locally'}
                                {conflict.conflictType === 'delete_server' && 'Deleted on Server'}
                              </Badge>
                              <span className="font-medium">{conflict.localItem.category}</span>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent className="mt-4">
                            {/* Comparison View */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {/* Local Version */}
                              <div className={cn(
                                "p-3 rounded-lg border-2 transition-all",
                                currentResolution === 'keep_local' 
                                  ? "border-primary bg-primary/10" 
                                  : "border-border bg-muted/50"
                              )}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Smartphone className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium text-sm">Your Device</span>
                                </div>
                                <p className="text-sm mb-1">{conflict.localItem.description}</p>
                                <p className={cn(
                                  "text-lg font-bold",
                                  conflict.localItem.type === 'income' ? "text-green-500" : "text-red-500"
                                )}>
                                  {formatAmount(conflict.localItem.amount, conflict.localItem.type)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Updated: {formatDate(conflict.localItem.updatedAt)}
                                </p>
                                {conflict.localItem.deleted && (
                                  <Badge variant="destructive" className="mt-2">Deleted</Badge>
                                )}
                              </div>

                              {/* Server Version */}
                              <div className={cn(
                                "p-3 rounded-lg border-2 transition-all",
                                currentResolution === 'keep_server' 
                                  ? "border-primary bg-primary/10" 
                                  : "border-border bg-muted/50"
                              )}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Cloud className="h-4 w-4 text-purple-500" />
                                  <span className="font-medium text-sm">Server</span>
                                </div>
                                <p className="text-sm mb-1">{conflict.serverItem.description}</p>
                                <p className={cn(
                                  "text-lg font-bold",
                                  conflict.serverItem.type === 'income' ? "text-green-500" : "text-red-500"
                                )}>
                                  {formatAmount(conflict.serverItem.amount, conflict.serverItem.type)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Updated: {formatDate(conflict.serverItem.updatedAt)}
                                </p>
                                {conflict.serverItem.deleted && (
                                  <Badge variant="destructive" className="mt-2">Deleted</Badge>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Resolution Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant={currentResolution === 'keep_local' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleResolutionChange(conflictId, 'keep_local')}
                          >
                            <Smartphone className="h-4 w-4 mr-1" />
                            Keep Local
                          </Button>
                          <Button
                            variant={currentResolution === 'keep_server' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleResolutionChange(conflictId, 'keep_server')}
                          >
                            <Cloud className="h-4 w-4 mr-1" />
                            Keep Server
                          </Button>
                          <Button
                            variant={currentResolution === 'merge' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleResolutionChange(conflictId, 'merge')}
                            disabled={conflict.localItem.deleted || conflict.serverItem.deleted}
                          >
                            <GitMerge className="h-4 w-4 mr-1" />
                            Merge
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {resolutions.size} of {conflicts.length} resolved
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleResolveAll} disabled={!allResolved}>
              <Check className="h-4 w-4 mr-1" />
              Apply Resolutions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
