import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/contexts/AppContext';

describe('AppContext', () => {
  // Helper to render hook with provider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Projects', () => {
    it('should add a project', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addProject('Test Project', '#FF0000', 50);
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0].name).toBe('Test Project');
      expect(result.current.projects[0].color).toBe('#FF0000');
      expect(result.current.projects[0].rate).toBe(50);
    });

    it('should not add project with empty name', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addProject('', '#FF0000');
      });

      expect(result.current.projects).toHaveLength(0);
    });

    it('should not add project with invalid color', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addProject('Test', 'invalid-color');
      });

      expect(result.current.projects).toHaveLength(0);
    });

    it('should trim project names', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addProject('  Test Project  ', '#FF0000');
      });

      expect(result.current.projects[0].name).toBe('Test Project');
    });

    it('should delete a project', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addProject('Test Project', '#FF0000');
      });

      const projectId = result.current.projects[0].id;

      act(() => {
        result.current.deleteProject(projectId);
      });

      expect(result.current.projects).toHaveLength(0);
    });
  });

  describe('Timer', () => {
    it('should start timer', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.timerState).toBe('idle');

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.timerState).toBe('running');
      expect(result.current.activeEntry).toBeDefined();
    });

    it('should not start timer if already active', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.startTimer();
      });

      const firstEntryId = result.current.activeEntry?.id;

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.activeEntry?.id).toBe(firstEntryId);
      expect(result.current.entries).toHaveLength(1);
    });

    it('should pause timer', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.timerState).toBe('running');

      act(() => {
        result.current.pauseTimer();
      });

      expect(result.current.timerState).toBe('paused');
    });

    it('should resume timer', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        result.current.pauseTimer();
      });

      act(() => {
        result.current.resumeTimer();
      });

      expect(result.current.timerState).toBe('running');
    });

    it('should stop timer', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        result.current.stopTimer();
      });

      expect(result.current.timerState).toBe('idle');
      expect(result.current.activeEntry).toBeNull();
      expect(result.current.entries[0].endAt).toBeDefined();
    });
  });

  describe('Retroactive Entries', () => {
    it('should add retroactive entry', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-01T11:00:00');

      act(() => {
        result.current.addRetroEntry(undefined, startDate, endDate, 'Test note');
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].source).toBe('retro');
      expect(result.current.entries[0].note).toBe('Test note');
    });

    it('should not add entry with invalid start date', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addRetroEntry(undefined, new Date('invalid'), null);
      });

      expect(result.current.entries).toHaveLength(0);
    });

    it('should not add entry with end date before start date', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const startDate = new Date('2024-01-01T11:00:00');
      const endDate = new Date('2024-01-01T10:00:00');

      act(() => {
        result.current.addRetroEntry(undefined, startDate, endDate);
      });

      expect(result.current.entries).toHaveLength(0);
    });
  });

  describe('Language', () => {
    it('should default to Arabic', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.language).toBe('ar');
    });

    it('should switch language', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');
    });
  });

  describe('Entry Management', () => {
    it('should delete entry', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        result.current.stopTimer();
      });

      const entryId = result.current.entries[0].id;

      act(() => {
        result.current.deleteEntry(entryId);
      });

      expect(result.current.entries).toHaveLength(0);
    });

    it('should update entry', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        result.current.stopTimer();
      });

      const entryId = result.current.entries[0].id;

      act(() => {
        result.current.updateEntry(entryId, { note: 'Updated note' });
      });

      expect(result.current.entries[0].note).toBe('Updated note');
    });
  });
});
