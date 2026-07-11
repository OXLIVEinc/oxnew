import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageIcon, Plus, Trash2, Edit2, Check } from 'lucide-react';

interface VenueSection {
  id?: string;
  name: string;
  color: string;
  capacity: number;
  ticket_tier_id: string | null;
  sort_order: number;
}

interface TicketTierOption {
  id: string;
  name: string;
  price: number;
}

interface VenueSeatingMapEditorProps {
  mapImagePreview: string | null;
  onMapImageChange: (file: File, preview: string) => void;
  sections: VenueSection[];
  onSectionsChange: (sections: VenueSection[]) => void;
  ticketTiers: TicketTierOption[];
}

const SECTION_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

export const VenueSeatingMapEditor: React.FC<VenueSeatingMapEditorProps> = ({
  mapImagePreview,
  onMapImageChange,
  sections,
  onSectionsChange,
  ticketTiers,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onMapImageChange(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  const addSection = () => {
    const colorIndex = sections.length % SECTION_COLORS.length;
    onSectionsChange([
      ...sections,
      {
        name: `Section ${String.fromCharCode(65 + sections.length)}`,
        color: SECTION_COLORS[colorIndex],
        capacity: 50,
        ticket_tier_id: ticketTiers.length > 0 ? ticketTiers[0].id : null,
        sort_order: sections.length,
      },
    ]);
    setEditingIndex(sections.length);
  };

  const updateSection = (index: number, updates: Partial<VenueSection>) => {
    const updated = sections.map((s, i) => (i === index ? { ...s, ...updates } : s));
    onSectionsChange(updated);
  };

  const removeSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">VENUE SEATING MAP</h3>
      </div>

      {/* Map Image Upload */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4" />
          <span className="text-[11px] uppercase font-medium">Venue Layout Image</span>
        </div>
        <p className="text-[11px] text-gray-500 mb-2">Upload your venue's seating layout (JPG/PNG)</p>
        <label className="block w-full aspect-video border border-dashed border-black bg-[#F5F5F5] flex items-center justify-center cursor-pointer hover:bg-[#ECECEC] transition-colors overflow-hidden relative">
          {mapImagePreview ? (
            <img src={mapImagePreview} alt="Venue seating map" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-[#999]" />
              <span className="text-[11px] uppercase text-[#999]">Upload Venue Layout</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase font-medium">Sections / Zones</span>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1 text-[11px] uppercase font-medium px-3 py-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Section
          </button>
        </div>

        {sections.length === 0 && (
          <p className="text-[12px] text-gray-400 py-4 text-center border border-dashed border-gray-300">
            No sections added yet. Click "Add Section" to define venue zones.
          </p>
        )}

        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={index}
              className="border border-[#1A1A1A] p-3"
            >
              {editingIndex === index ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSection(index, { name: e.target.value })}
                      placeholder="Section name"
                      className="flex-1 px-2 py-1.5 text-[13px] border border-gray-300 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={section.color}
                      onChange={(e) => updateSection(index, { color: e.target.value })}
                      className="w-10 h-8 cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Capacity</label>
                      <input
                        type="number"
                        min={1}
                        value={section.capacity}
                        onChange={(e) => updateSection(index, { capacity: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-[13px] border border-gray-300 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Linked Ticket Tier</label>
                      <select
                        value={section.ticket_tier_id || ''}
                        onChange={(e) => updateSection(index, { ticket_tier_id: e.target.value || null })}
                        className="w-full px-2 py-1.5 text-[13px] border border-gray-300 focus:outline-none bg-white"
                      >
                        <option value="">— None —</option>
                        {ticketTiers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.price > 0 ? `₦${t.price}` : 'Free'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => removeSection(index)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setEditingIndex(null)} className="text-green-600 p-1"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: section.color }} />
                    <div>
                      <div className="text-[13px] font-medium">{section.name}</div>
                      <div className="text-[11px] text-gray-500">
                        Cap: {section.capacity}
                        {section.ticket_tier_id && ticketTiers.find(t => t.id === section.ticket_tier_id) && (
                          <> · {ticketTiers.find(t => t.id === section.ticket_tier_id)!.name}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditingIndex(index)} className="p-1 text-gray-500 hover:text-black"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => removeSection(index)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export type { VenueSection };
