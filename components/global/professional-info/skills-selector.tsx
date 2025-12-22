import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusIcon, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const SkillsSelector = ({ errors, setValue, watchSkills }: any) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(watchSkills);

  useEffect(() => {
    if (watchSkills && watchSkills.length > 0) {
      setSelectedSkills(watchSkills);
    }
  }, [watchSkills]);

  const availableSkills = [
    'PPE',
    'VACCINE',
    'ORAL HYGIENE',
    'MEDICAL TERMINOLOGY',
    'BEDPAN',
    'HANDWASHING',
    'COMMUNICATION',
    'BRUSHING DENTURES',
    'BLOOD PRESSURE',
    'DRESSING PATIENTS',
  ];
  const handleSkillAdd = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setValue('skills', [...selectedSkills, skill], { shouldDirty: true });
      errors.skills = {};
    }
  };

  const handleSkillRemove = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    setValue(
      'skills',
      selectedSkills.filter((s) => s !== skill),
      { shouldDirty: true }
    );
  };

  return (
    <>
      <div className='border border-[#DFE2E0] rounded-[16px] p-5'>
        <div className='flex items-center rounded-[12px] min-h-[70px] h-auto bg-[#f9f9f9] border border-input p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none'>
          <div className='flex flex-row flex-wrap gap-2 w-full'>
            {selectedSkills.map((skill) => (
              <EachSkill
                key={skill}
                skill={skill}
                handleSkillRemove={handleSkillRemove}
                type='remove'
              />
            ))}
            <input
              className='max-w-[450px] w-full bg-[#f9f9f9] border-none focus-visible:outline-none'
              type='text'
              placeholder='Type and press Enter to add the value or select from below'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  e.preventDefault();
                  handleSkillAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
      {availableSkills.length > 0 && (
        <div className='flex flex-wrap gap-4 border border-[#DFE2E0] rounded-[16px] p-5'>
          {availableSkills.map((skill) => (
            <EachSkill
              key={skill}
              skill={skill}
              handleSkillAdd={handleSkillAdd}
              selectedSkills={selectedSkills}
              type='add'
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SkillsSelector;

const EachSkill = ({
  skill,
  handleSkillAdd,
  handleSkillRemove,
  type,
  selectedSkills,
}: {
  skill: string;
  handleSkillAdd?: (skill: string) => void;
  handleSkillRemove?: (skill: string) => void;
  selectedSkills?: string[];
  type: 'add' | 'remove';
}) => {
  return (
    <Button
      className={cn(
        'flex items-center gap-1.5 rounded-[12px] h-11 font-medium text-sm px-3 py-1',
        type === 'add'
          ? 'bg-white text-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white '
          : 'bg-[#1C1C1C] text-white hover:bg-white hover:text-black'
      )}
      disabled={selectedSkills?.includes(skill)}
      onClick={() =>
        type === 'add' ? handleSkillAdd!(skill) : handleSkillRemove!(skill)
      }
    >
      {type === 'add' ? (
        <PlusIcon className='w-4 h-4' />
      ) : (
        <XIcon className='w-4 h-4' />
      )}
      {skill}
    </Button>
  );
};
