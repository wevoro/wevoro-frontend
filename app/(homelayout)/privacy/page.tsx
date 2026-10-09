import { getResourcePagesData } from '@/app/actions';
import Container from '@/components/global/container';
import { urlFor } from '@/sanity/lib/client';
import { PortableText } from '@portabletext/react';
import FeedbackMount from '@/components/global/feedback/feedback-mount';
import React from 'react';

const PrivacyPage = async () => {
  const data = await getResourcePagesData();

  return (
    <div>
      <Container className='my-32'>
        <PortableText
          value={data.privacyPolicy}
          components={{
            types: {
              image: ({ value }) => (
                <div className='my-4'>
                  <img
                    src={urlFor(value.asset)}
                    alt={value.alt || 'Sanity Image'}
                    className='w-full max-w-[500px]'
                  />
                </div>
              ),
            },
          }}
        />
      </Container>
      {/* SCRUM-200: Privacy and Terms sit in the public (homelayout) group, so
          they never got SCRUM-98's Feedback button from app/(private)/layout.
          FeedbackMount carries that layout's rule verbatim, which is what keeps
          the button off this page for a logged-out reader. */}
      <FeedbackMount />
    </div>
  );
};

export default PrivacyPage;
