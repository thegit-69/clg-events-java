import { useRef, useState, useEffect } from 'react'
import { IoDownloadOutline, IoLockClosed, IoPrintOutline } from 'react-icons/io5'
import html2pdf from 'html2pdf.js'
import Button from './Button'
import { subscribeUserAttendance } from '../../services/eventService'

export default function CertificateDownload({ studentName, eventName, userId, eventId, eventDate }) {
    const certificateRef = useRef(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [attended, setAttended] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId || !eventId) {
            setAttended(false)
            setLoading(false)
            return () => { }
        }

        setLoading(true)

        const unsubscribe = subscribeUserAttendance(
            eventId,
            userId,
            (hasAttended) => {
                setAttended(hasAttended)
                setLoading(false)
            },
            (error) => {
                console.error('Failed to verify attendance:', error)
                setLoading(false)
            }
        )

        return () => {
            unsubscribe()
        }
    }, [userId, eventId])

    const handleDownload = async () => {
        if (!certificateRef.current) return
        setIsGenerating(true)

        const element = certificateRef.current
        const opt = {
            margin: 0,
            filename: `${studentName.replace(/\s+/g, '_')}_${eventName.replace(/\s+/g, '_')}_Certificate.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        }

        try {
            await html2pdf().set(opt).from(element).save()
        } catch (error) {
            console.error('Certificate generation failed:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-dark-50 border border-dark-100 rounded-xl p-6 flex flex-col items-center justify-center h-24 animate-pulse">
                <div className="h-4 w-32 bg-dark-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-dark-200 rounded"></div>
            </div>
        )
    }

    // If user hasn't attended, show locked state
    if (!attended) {
        return (
            <div className="bg-dark-100 border border-dark-200 rounded-xl p-6 flex flex-col items-center text-center opacity-75">
                <div className="w-12 h-12 bg-dark-200 rounded-full flex items-center justify-center mb-3">
                    <IoLockClosed className="text-2xl text-dark-400" />
                </div>
                <h3 className="text-lg font-bold text-dark-800">Certificate Locked</h3>
                <p className="text-sm text-dark-500 mt-1 max-w-[250px]">
                    You must attend the event "{eventName}" to unlock your certificate of participation.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                            <IoPrintOutline className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-dark-900">Download Certificate</h3>
                            <p className="text-sm text-dark-500">
                                Your official certificate of participation is ready.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full md:w-auto shadow-lg shadow-primary-500/20"
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2">Generating...</span>
                        ) : (
                            <>
                                <IoDownloadOutline className="text-lg" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Hidden Certificate Template */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div
                    ref={certificateRef}
                    className="w-[1123px] h-[794px] bg-white relative"
                    style={{ fontFamily: "'Times New Roman', serif" }}
                >
                    <img
                        src="/certificate-bg.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />

                    {/* Participant Name Overlay */}
                    <div className="absolute top-[50%] left-0 w-full text-center z-10">
                        <span className="text-5xl font-bold text-dark-900 font-serif italic tracking-wide">
                            {studentName || 'Student Name'}
                        </span>
                    </div>

                    {/* Event Name Overlay */}
                    <div className="absolute top-[62%] left-0 w-full text-center z-10">
                        <span className="text-4xl font-bold text-dark-800 tracking-wide">
                            {eventName || 'Event Name'}
                        </span>
                    </div>

                    {/* ID or Ref Code Overlay */}
                    <div className="absolute bottom-[7%] left-0 w-full text-center z-10">
                        <p className="text-sm text-dark-800 opacity-70 font-mono">
                            Certificate ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
