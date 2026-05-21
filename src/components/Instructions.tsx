const steps = [
  {
    number: "1",
    title: "Open Instagram on your phone",
    description:
      'Go to your profile, tap the menu (☰), then Settings and privacy → Your activity → Download your information.',
  },
  {
    number: "2",
    title: 'Select "Download or transfer information"',
    description:
      'Choose "Some of your information", then check "Followers and following" under Connections.',
  },
  {
    number: "3",
    title: "Request a JSON export",
    description:
      'Set the format to JSON (not HTML), choose "Download to device", then tap Create files. Instagram will email you when it\'s ready (usually within a few minutes).',
  },
  {
    number: "4",
    title: "Change the date range to All Time",
    description:
      'Before creating the files, make sure the date range is set to "All time" so your complete followers and following lists are included.',
  },
  {
    number: "5",
    title: "Download and upload here",
    description:
      "Download the ZIP file Instagram sends you, then drag and drop it into the upload area above.",
  },
];

export default function Instructions() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
        How to get your data export
      </h2>
      <ol className="flex flex-col gap-4">
        {steps.map((step) => (
          <li key={step.number} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-xs font-bold text-white">
              {step.number}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-700">{step.title}</p>
              <p className="mt-0.5 text-sm text-gray-400">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-600">
        Your data is processed on our server and immediately discarded — nothing
        is stored or shared.
      </p>
    </div>
  );
}
